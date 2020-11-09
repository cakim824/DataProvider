// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
var { sendPreparedStatementToInfomart } = require("../../utils/mssql");

getAgentKey = async({ site_cd, group_cd, agent_id }) => {
    
    var agent_id_list = '';
    var agent_id_query = '';

    var group_cd_list = '';
    var group_cd_query = '';
    
    if (agent_id != '' && typeof agent_id != 'undefined') {
        console.log('agent_id ' + agent_id);
        agent_id_list = `'` + agent_id.replace(/,/g, '\', \'') + `'`;
        agent_id_query = `AND  C.RESOURCE_NAME IN ( ${agent_id_list} )`
    }

    if (group_cd != '' && typeof group_cd != 'undefined') {
        console.log('group_cd ' + group_cd);
        group_cd_list = `'` + group_cd.replace(/,/g, '\', \'') + `'`;
        group_cd_query = `AND  B.GROUP_NAME IN ( ${group_cd_list} )`
    }
    
    var query =
    `
    SELECT DISTINCT A.RESOURCE_KEY as AGENT_KEY, C.RESOURCE_NAME as AGENT_ID, C.AGENT_FIRST_NAME as AGENT_NAME
    FROM    RESOURCE_GROUP_FACT A
            INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
            INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
            INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
    WHERE   A.TENANT_KEY = 1
        AND  A.ACTIVE_FLAG = 1
        AND  T.END_TS IS NULL
        AND  C.AGENT_LAST_NAME = '${site_cd}'
        ${group_cd_query}
        ${agent_id_query} 
    ; `
    ;
    
    console.log(`[get][getAgentKey]: query = ` + query);
    const rows = await sendPreparedStatementToInfomart(query);

    // var agentKey = rows;
    agent_key = ``
    for (var i = 0; rows[i]; i++) {
        if (i == 0) agent_key = agent_key + rows[i].AGENT_KEY;
        else agent_key = agent_key + `, ` + rows[i].AGENT_KEY;
    }

    // var agent_key = rows[0].AGENT_KEY;
    console.log(`[getAgentKey] agent_key_list = ` + agent_key);
    return agent_key;

};

getAgentId = async({ site_cd, group_cd, agent_name }) => {

    var agent_name_list = '';
    var agent_name_query = '';

    var group_cd_list = '';
    var group_cd_query = '';
    
    if (agent_name != '' && typeof agent_name != 'undefined') {
        console.log('agent_name' + agent_name);
        agent_name_list = `'` + agent_name.replace(/,/g, '\', \'') + `'`;
        agent_name_query = `AND  C.AGENT_FIRST_NAME IN ( ${agent_name_list} )`
    }

    if (group_cd != '' && typeof group_cd != 'undefined') {
        console.log('group_cd' + group_cd);
        group_cd_list = `'` + group_cd.replace(/,/g, '\', \'') + `'`;
        group_cd_query = `AND  B.GROUP_NAME IN ( ${group_cd_list} )`
    }

    var query =
    `
    SELECT ROW_NUMBER() OVER(ORDER BY X.AGENT_ID) AS NUM, *
    FROM (
        SELECT  DISTINCT C.RESOURCE_NAME as AGENT_ID, C.AGENT_FIRST_NAME as AGENT_NAME
        FROM    RESOURCE_GROUP_FACT A
                INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
                INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
                INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
        WHERE   A.TENANT_KEY = 1
            AND  A.ACTIVE_FLAG = 1
            AND  T.END_TS IS NULL
            AND  C.AGENT_LAST_NAME = '${site_cd}'
            ${group_cd_query}
            ${agent_name_query}
        -- ORDER BY  C.RESOURCE_NAME
    ) X
    ; `
    ;
    
    console.log(`[getAgentId] query = ` + query);
    const rows = await sendPreparedStatementToInfomart(query);

    console.log(`[getAgentId] rows ` + JSON.stringify(rows));
    return rows;

};

module.exports = {
    getAgentKey,
    getAgentId
}