

const buildBasicResolvers = (cacheKey, viewName) => {
    const getById = async(root, args, ctx) => {
        // let cacheResult = cacheService.retrieveFromCache(`${cacheKey}.${args.id}`);
        // // console.log('cacheResult - ', cacheResult);
        // if(cacheResult)
        // {
        //     ++ctx.cacheCount;
        //     console.log('cache retrieval', ctx.cacheCount);
        //     return cacheResult;
        // }
        // else {
            const promise = ctx.db.query(`select * from ${viewName} where id = ? && "companyId" = ?`, [args.id, ctx.cid]);
            // cacheService.memoizeSingleRow(cacheKey, promise);
            let result = await promise;
            // if(result)
            // {
            //     result = result[0];
            // }
            return result;
        // }
    };
    const getCollection = async (root, args, ctx) => {
        // ++ctx.queryCountx/;
        // console.log('queryCount ', ctx.queryCount);
        const collectionPromise = ctx.db.query(`select * from ${viewName} where "companyId" = ?`, [ctx.cid]);
        // cacheService.memoizeCollection(cacheKey, collectionPromise);
        return collectionPromise;
    };
    return {
        getById,
        getCollection
    }
};

module.exports = {buildBasicResolvers};
