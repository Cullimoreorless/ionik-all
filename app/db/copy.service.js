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
    try {


        pool.connect(async (err, client, callback) => {
            let stream = await client.query(copyTo(query));
            // console.log(stream);
            stream.pipe(process.stdout);
            // stream.on('error', done);
            // stream.on('end', done);
            // console.log(stream);
            stream.pipe(res);
            return stream;
        })
    }
    catch(error)
    {
        console.log('Copy To error', error.message);
    }
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
