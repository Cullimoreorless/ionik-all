const db = require('./db.service');

const getUnassociatedCompanyIntegrationsQuery = 'select * from public.vw_company_integrations_list where companyid is null';
const getCompaniesQuery = 'select companyid, companycode, companyname, compoundname from public.vw_company_list';
const getCompanyIntegrationsQuery = 'select * from public.vw_company_integrations_list where companyid = :companyId';
const saveCompanyAssociationQuery = 'update public.company_identifier set companyid = :companyId where companyidentifierid = :companyIntegrationId';
const deassociationQuery = 'update public.company_identifier set companyid = null where companyidentifierid = :companyIntegrationId';

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
        console.error('Admin Service - getCompanies - error: ', error.message);
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

const getCompanyIntegrations = async (companyId) => {
    try {
        const result = await db.executeQuery(getCompanyIntegrationsQuery, {companyId});
        if(result )
        {
            return result;
        }
        else
        {
            return [];
        }
    }
    catch (e) {
        console.error('Admin Service - getCompanyIntegrations - error: ', error.message);
    }
};

const saveCompanyAssociation = async (companyAssociation) => {
    try
    {
        console.log(companyAssociation);
        const result = await db.executeQuery(saveCompanyAssociationQuery, companyAssociation);
        return result;
    }
    catch(err){
        console.error('Admin Service - saveCompanyAssociation - error: ', error.message)
    }
};

const deassociateIntegration = async (companyIntegrationObj) => {
    try {
        const result = await db.executeQuery(deassociationQuery, companyIntegrationObj);
        return result;
    }
    catch(error)
    {
        console.error('Admin Service - deassociate - error: ', error.message);
    }
}

module.exports = {
    getCompanies, getUnassociatedIntegrations, getCompanyIntegrations, saveCompanyAssociation, deassociateIntegration
};
