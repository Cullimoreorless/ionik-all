const {Pool} = require('pg');
const dbConn = {
    user:process.env.IONIKDBUSER,
    password:process.env.IONIKDBPASSWORD,
    host:process.env.IONIKDBHOST,
    database:process.env.IONIKDBDATABASE,
    port:process.env.IONIKDBPORT
};
const copyTo = require('pg-copy-streams').to;
const copyFrom = require('pg-copy-streams').from;

const pool = new Pool(dbConn);

const getCopyStream = async (query) => {
    return new Promise((resolve, reject) => {
            pool.connect(async (err, client, callback) => {
                if(err)
                {
                    reject(err);
                }
                let stream = await client.query(copyTo(query));
                stream.pipe(process.stdout);
                resolve(stream);
            })
        });
};

const copyFileIntoDB = async (filePath, tableName) => {
    return new Promise((resolve, reject) => {
        pool.connect(async (err, client, cb) => {
            if(err){
                reject(err);
            }
            const copier = copyFrom(`copy ${tableName} from '${filePath}' with csv header;`);
            copier.cb_flush = () => {};
            let copyResult = client.query(copier);
            resolve(copyResult);
        })
    })
};

const done = (err) => {
    if(err)
    {

        console.error(err);
    }
    else
    {
        console.log('should disconnect');//pool.disconnect();
    }
};

module.exports = {getCopyStream, copyFileIntoDB};
