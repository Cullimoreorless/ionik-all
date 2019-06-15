const db = require('./db.service');

const getUnassociatedCompanyIntegrationsQuery = 'select * from public.vw_company_integrations_list where companyid is null';
const getCompaniesQuery = 'select companyid, companycode, companyname, compoundname from public.vw_company_list';

const getCompanies = async () =>{
    try {
        const result = await db.executeQuery(getCompaniesQuery, null);
        console.log(result);
        if(result )
        {
            return result;
        }
        else
        {
            return [];
        }
    }
    catch(error)
    {
        console.error('Admin Serivce - getCompanies - error: ', error.message);
    }
};

const getUnassociatedIntegrations = async () => {
    try {
        const result = await db.executeQuery(getUnassociatedCompanyIntegrationsQuery,null);
        if(result )
        {
            return result;
        }
        else
        {
            return [];
        }
    }
    catch(error)
    {
        console.error('Admin Service = getUnassociatedIntegrations - error: ', error.message);
    }
};


module.exports = {
    getCompanies, getUnassociatedIntegrations
};
