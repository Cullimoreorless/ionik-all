const {Pool} = require('pg');
const dbConn = {
    user:process.env.IONIKDBUSER,
    password:process.env.IONIKDBPASSWORD,
    host:process.env.IONIKDBHOST,
    database:process.env.IONIKDBDATABASE,
    port:process.env.IONIKDBPORT
};
const copyTo = require('pg-copy-streams').to;

const pool = new Pool(dbConn);

const getCopyStream = async (query, res) => {
    return new Promise((resolve, reject) => {
            pool.connect(async (err, client, callback) => {
                if(err)
                {
                    reject(err);
                }
                // console.log(client);
                let stream = await client.query(copyTo(query));
                // console.log(stream);
                stream.pipe(process.stdout);
                // stream.on('error', done);
                // stream.on('end', done);
                // console.log(stream);
                // stream.pipe(res);
                resolve(stream);
            })
        });
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

module.exports = {getCopyStream};
