// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
var { sendPreparedStatementToInfomart } = require("../../utils/mssql");

getAgentGroupCode = async({ site_cd, group_cd }) => {
    
    var group_cd_list = ''
    var group_cd_query = '';
    
    if (group_cd != '' && typeof group_cd != 'undefined') {
        group_cd_list = `'` + group_cd.replace(/,/g, '\', \'') + `'`;
        group_cd_query = `AND  B.GROUP_NAME IN ( ${group_cd_list} )`
    }
   
    var query =
    `
    SELECT ROW_NUMBER() OVER(ORDER BY X.GROUP_CODE) AS NUM, X.GROUP_CODE
    FROM (
        SELECT DISTINCT B.GROUP_NAME as GROUP_CODE
        FROM  RESOURCE_GROUP_FACT A
            INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
            INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
            INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
        WHERE T.TENANT_KEY = 1
            AND  A.ACTIVE_FLAG = '1'
            AND  T.END_TS IS NULL
            AND  C.AGENT_LAST_NAME = '${site_cd}'
            ${group_cd_query} 
            
    ) X
    ;`
    ;

    console.log(`[getAgentGroupCode]: query = ` + query);
    const rows = await sendPreparedStatementToInfomart(query);

    console.log(`[getAgentGroupCode]: rows = ` + JSON.stringify(rows));
    return rows;

};

getAgentGroupKey = async({ site_cd, group_cd }) => {
    
    var group_cd_list = ''
    var group_cd_query = '';
    
    if (group_cd != '') {
        group_cd_list = `'` + group_cd.replace(/,/g, '\', \'') + `'`;
        group_cd_query = `AND  B.GROUP_NAME IN ( ${group_cd_list} )`
    }
   
    var query =
    `
    SELECT DISTINCT B.GROUP_NAME as GROUP_NAME, B.GROUP_KEY as GROUP_KEY
    FROM  RESOURCE_GROUP_FACT A
        INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
        INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
        INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
    WHERE T.TENANT_KEY = 1
        AND  A.ACTIVE_FLAG = '1'
        AND  T.END_TS IS NULL
        AND  C.AGENT_LAST_NAME = '${site_cd}'
        ${group_cd_query} 
    ;`
    ;

    console.log(`[get][getAgentGroupKey]: query = ` + query);
    const rows = await sendPreparedStatementToInfomart(query);

    // var groupKey = rows;
    agent_group_key = ``
    for (var i = 0; rows[i]; i++) {
        if (i == 0) agent_group_key = agent_group_key + rows[i].GROUP_KEY;
        else agent_group_key = agent_group_key + `, ` + rows[i].GROUP_KEY;
    }

    // var agent_group_key = rows[0].AGENT_GROUP_KEY;
    
    console.log(`[getAgentGroupKey] agent-group-key = ` + agent_group_key);
    return agent_group_key;

};

module.exports = {
    getAgentGroupCode,
    getAgentGroupKey
}