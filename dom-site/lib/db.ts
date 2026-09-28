import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {createPool,type Pool,type PoolConnection,type ResultSetHeader,type RowDataPacket} from 'mysql2/promise';
import {mysqlSchema,sqliteSchema} from './database-schema';

type Value=string|number|null;
type Result={results:Record<string,unknown>[];meta:{changes:number}};
type Sqlite=import('node:sqlite').DatabaseSync;
type State={pool?:Pool;sqlite?:Sqlite;initializing?:Promise<void>};
const globalDatabase=globalThis as typeof globalThis & {domDatabase?:State};
const state=globalDatabase.domDatabase??={};
const mysqlConfigured=()=>!!(process.env.DB_HOST&&process.env.DB_USER&&process.env.DB_NAME);
export function databaseDriver(){return mysqlConfigured()?'mysql':'sqlite';}

async function initialize(){
  if(state.initializing)return state.initializing;
  state.initializing=(async()=>{
    if(mysqlConfigured()){
      state.pool??=createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,charset:'utf8mb4',connectionLimit:4,waitForConnections:true,queueLimit:20,connectTimeout:10000,supportBigNumbers:true,bigNumberStrings:false,...(process.env.DB_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
      for(const sql of mysqlSchema)await state.pool.query(sql);
    }else{
      if(process.env.NODE_ENV==='production'&&process.env.ALLOW_LOCAL_SQLITE!=='true')throw Error('Configure DB_HOST, DB_USER, DB_PASSWORD and DB_NAME before using the admin or booking.');
      const file=path.join(process.cwd(),'.data','dom.sqlite');mkdirSync(path.dirname(file),{recursive:true});
      const {DatabaseSync}=await import('node:sqlite');state.sqlite??=new DatabaseSync(file);state.sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
      for(const sql of sqliteSchema)state.sqlite.exec(sql);
    }
  })().catch(error=>{state.initializing=undefined;throw error;});
  return state.initializing;
}

async function execute(sql:string,args:Value[],connection?:PoolConnection):Promise<Result>{
  await initialize();
  if(state.pool){
    const statement=sql.replace(/^INSERT OR IGNORE /,'INSERT IGNORE ');
    const [rows]=await (connection||state.pool).query(statement,args);
    return Array.isArray(rows)?{results:rows as RowDataPacket[],meta:{changes:0}}:{results:[],meta:{changes:(rows as ResultSetHeader).affectedRows}};
  }
  return executeSqlite(sql,args);
}
function executeSqlite(sql:string,args:Value[]):Result{
  const statement=state.sqlite!.prepare(sql);
  if(/^\s*(?:SELECT|WITH|PRAGMA)\b/i.test(sql))return {results:statement.all(...args) as Record<string,unknown>[],meta:{changes:0}};
  return {results:[],meta:{changes:Number(statement.run(...args).changes)}};
}

class Statement{
  constructor(readonly sql:string,readonly args:Value[]=[],readonly connection?:PoolConnection){ }
  bind(...args:Value[]){return new Statement(this.sql,args,this.connection);}
  async first<T=Record<string,unknown>>(){const result=await execute(this.sql,this.args,this.connection);return (result.results[0] as T|undefined)??null;}
  all(){return execute(this.sql,this.args,this.connection);}
  run(){return execute(this.sql,this.args,this.connection);}
}
export function db(){return {
  prepare:(sql:string)=>new Statement(sql),
  async exclusive<T>(work:(transaction:{prepare:(sql:string)=>Statement})=>Promise<T>){
    await initialize();
    if(state.pool){
      const connection=await state.pool.getConnection();let locked=false;
      try{
        const [rows]=await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?,10) AS locked',['dom_booking']);
        if(Number(rows[0]?.locked)!==1)throw new Error('Could not acquire booking lock');
        locked=true;
        await connection.beginTransaction();
        try{const result=await work({prepare:(sql:string)=>new Statement(sql,[],connection)});await connection.commit();return result;}
        catch(error){await connection.rollback();throw error;}
      }finally{try{if(locked)await connection.query('SELECT RELEASE_LOCK(?)',['dom_booking']);}finally{connection.release();}}
    }
    state.sqlite!.exec('BEGIN IMMEDIATE');
    try{const result=await work({prepare:(sql:string)=>new Statement(sql)});state.sqlite!.exec('COMMIT');return result;}
    catch(error){state.sqlite!.exec('ROLLBACK');throw error;}
  },
  async batch(statements:Statement[]){
    await initialize();
    if(state.pool){const connection=await state.pool.getConnection();try{await connection.beginTransaction();const results:Result[]=[];for(const s of statements)results.push(await execute(s.sql,s.args,connection));await connection.commit();return results;}catch(error){await connection.rollback();throw error;}finally{connection.release();}}
    state.sqlite!.exec('BEGIN');try{const results=statements.map(s=>executeSqlite(s.sql,s.args));state.sqlite!.exec('COMMIT');return results;}catch(error){state.sqlite!.exec('ROLLBACK');throw error;}
  },
};}
