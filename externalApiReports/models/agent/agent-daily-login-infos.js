var { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { getTimestamp } = require('../../utils/date');

var isNotEmpty = value => value != "";

const getAgentDailyLoginInfos = async ({ site_cd, tenant_key, group_key, agent_key, start_date, end_date }) => {

    try {
        const start_timestamp = getTimestamp(start_date);
        const end_timestamp = getTimestamp(end_date) + 85500;
        console.log('end_date - start_date', end_timestamp, start_timestamp, end_timestamp - start_timestamp);
      
        var agent_group_query = "";
        var agent_id_query = "";

        if(isNotEmpty(group_key)) {
            agent_group_query = `AND B.GROUP_KEY IN (${group_key})`;
        }
        if(isNotEmpty(agent_key)) {
            agent_id_query = `AND A.RESOURCE_KEY IN (${agent_key})`;
        }

        const query = `
        SELECT 
            ROW_NUMBER() OVER(ORDER BY X.LOGIN_DAY, X.AGENT_NAME) AS NUM,
            X.LOGIN_DAY AS DATE_KEY, X.AGENT_NAME AS AGENT_NAME,
            CONVERT(VARCHAR(50), (DATEADD(S, X.START_TS + 9*3600, '1970-01-01')), 20) as LOGIN_TIME,
            (CASE WHEN (X.END_TS > ${end_timestamp}) THEN ''
                    ELSE (CONVERT(VARCHAR(50), (DATEADD(S, X.END_TS + 9*3600, '1970-01-01')), 20)) END) AS LOGOUT_TIME
        FROM(
            SELECT R.AGENT_FIRST_NAME AS AGENT_NAME,
                CONVERT(VARCHAR(10), (DATEADD(S, S.START_TS + 9 * 3600, '1970-01-01')), 120) as LOGIN_DAY,
                MIN(S.START_TS) AS START_TS,
                MAX(S.END_TS) AS END_TS 
            FROM SM_RES_SESSION_FACT S, RESOURCE_ R, RESOURCE_GROUP_FACT_ A, GROUP_ B 
            WHERE S.RESOURCE_KEY = R.RESOURCE_KEY 
                AND A.GROUP_KEY = B.GROUP_KEY 
                AND A.RESOURCE_KEY = R.RESOURCE_KEY 
                AND S.START_DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
                AND S.TENANT_KEY = ${tenant_key}
                AND R.AGENT_LAST_NAME = '${site_cd}'
                ${agent_group_query}
                ${agent_id_query}

            GROUP BY R.AGENT_FIRST_NAME, CONVERT(VARCHAR(10), (DATEADD(S, S.START_TS + 9 * 3600, '1970-01-01')), 120)
        ) X
        ;`
        ;
  
      console.log("[agent-login-infos] infomart_query: " + query + "\n");
      const rows = await sendPreparedStatementToInfomart(query);
      console.log("[agent-login-infos] rows: " + JSON.stringify(rows) + "\n");
      return rows;
  
      } catch (error) {
        throw error;
      }
};

module.exports = {
    getAgentDailyLoginInfos
}