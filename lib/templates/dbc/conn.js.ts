<% if (type === 'pgsql') { %>
import pg from 'pg';
import pgLocalConfig from './config';

const config = {
	user: process.env.PGUSER || pgLocalConfig.pgUser,
	database: process.env.PGDATABASE || pgLocalConfig.pgDatabase,
	password: process.env.PGPASSWORD || pgLocalConfig.pgPassword,
	host: process.env.PGHOST || pgLocalConfig.pgHost,
	port:  process.env.PGPORT || pgLocalConfig.pgPort,
	max: process.env.PGMAXPOOLCLIENTS || pgLocalConfig.pgMaxPoolClients,
	idleTimeoutMillis: process.env.PGTIMEOUTMILLI || pgLocalConfig.pgTimeoutMilli 
};

console.log(`[+] Enabling <%= name %> PG SQL client pool ...`);
const <%= camelCase %>PgPool = new pg.Pool(config, err => {
    if (err) {
        console.log(`[-] <%= name %> connection NOT established.  ${err}`);
        console.log(`[!] Check configuration /imports/startup/server/dbc/<%=fileName%>/config.<%=engine%>`);
    } else {
        console.log(`[+] Connection to <%= name %> SQL Server established.`);
    }                      
});

export default <%= camelCase %>PgPool;
<% } else if (type === 'mssql') { %>
import sql from 'mssql';
import msLocalConfig from './config';

const config = {
	user: process.env.MSUSER || msLocalConfig.msUser,
	database: process.env.MSDATABASE || msLocalConfig.msDatabase,
	password: process.env.MSPASSWORD || msLocalConfig.msPassword,
	server: process.env.MSHOST || msLocalConfig.msHost,
	port:  process.env.MSPORT || msLocalConfig.msPort,
    pool: {
        max: process.env.MSMAXPOOLCLIENTS || msLocalConfig.msMaxPoolClients,
        idleTimeoutMillis: process.env.MSTIMEOUTMILLI || msLocalConfig.msPoolTimeoutMilli
    },
    options: {
        trustedConnecton: true
    }

};

console.log(`[+] Enabling <%= name %> MS SQL client pool ...`);
const <%= camelCase %>MsPool = new sql.ConnectionPool(config, err => {
    if (err) {
        console.log(`[-] <%= name %> connection NOT established.  ${err}`);
        console.log(`[!] Check configuration /imports/startup/server/dbc/<%=fileName%>/config.<%=engine%>`);
    } else {
        console.log(`[+] Connection to <%= name %> SQL Server established.`);
    }
});

export default <%= camelCase %>MsPool;
<% } else if (type === 'mysql') { %>


<% } else if (type === 'mongo') { %>

<% } else if (type === 'sqlite') { %>
import Database from 'better-sqlite3';
import liteLocalConfig from './config';
const config = {
  memory: process.env.SQLLITEINMEM || liteLocalConfig.memory,
  readonly: process.env.SQLLITEREADONLY || liteLocalConfig.readonly,
  fileMustExist: process.env.FILEMUSTEXIST || liteLocalConfig.fileMustExist
}

console.log(`[+] Enabling <%= name %> SQL LITE3 client database ...`);
const <%= camelCase %>db = new Database(`${process.env['PWD']}/private/<%= camelCase %>.db`, config);
export default <%= camelCase %>db;
<% } %>
