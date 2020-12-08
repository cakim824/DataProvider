var { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { getTimestamp } = require('../../utils/date');

var isNotEmpty = value => value != "";

const DATE_UNITS = {
    hourly: {
        date_type: "CHAR(16)",
        main_view_name: "AGT_I_STATE_RSN_HOUR"
    },
    daily: {
        date_type: "CHAR(10)",
        main_view_name: "AGT_I_STATE_RSN_DAY"
    },
    monthly: {
        date_type: "CHAR(7)",
        main_view_name: "AGT_I_STATE_RSN_MONTH"
    }
};

const getViewName = date_unit => DATE_UNITS[date_unit].main_view_name;
const getDateType = date_unit => DATE_UNITS[date_unit].date_type;

const getAgentNotReadyInfos = async ({ date_unit, tenant_key, site_cd, group_key, agent_key, media_type_key, start_date, end_date, start_time, end_time }) => {

    const main_view_name = getViewName(date_unit);
    const date_type = getDateType(date_unit);

    const start_timestamp = getTimestamp(start_date); 
    const end_timestamp = getTimestamp(end_date) + 85500;
    console.log('end_timestamp: ', end_timestamp, 'start_timestamp: ', start_timestamp);

    var media_type_query = "";
    var agent_group_query = "";
    var agent_id_query = `AND R.RESOURCE_KEY IN (SELECT RESOURCE_KEY FROM RESOURCE_ WHERE RESOURCE_TYPE = 'Agent' AND AGENT_LAST_NAME = '${site_cd}')`;
    var time_range_query = "";

    if (isNotEmpty(media_type_key)) {
        media_type_query = ` AND X.MEDIA_TYPE_KEY IN (${media_type_key})`;
    }
    if (isNotEmpty(group_key)) {
        agent_group_query = ` AND R.RESOURCE_KEY IN ( ${agent_key} )`;
    }
    if (isNotEmpty(agent_key)) {
        agent_id_query = ` AND R.RESOURCE_KEY IN ( ${agent_key} )`;
    }
    if ( date_unit == "hourly" && isNotEmpty(start_time) ) {
        time_range_query = ` AND RIGHT(X.DATE_TIME_KEY, 5) BETWEEN '${start_time}' AND '${end_time}'`;
    }

  
    const query = `
    SELECT  ROW_NUMBER() OVER(ORDER BY X.DT_KEY, X.RESOURCE_KEY) AS NUM
            , LEFT(X.DT_KEY, 10) AS DATE_KEY 
            , (CASE WHEN LEN(X.DT_KEY) = 16 THEN RIGHT(X.DT_KEY, 5) ELSE '' END) AS TIME_KEY
            , (SELECT R.AGENT_FIRST_NAME FROM resource_ R WHERE X.RESOURCE_KEY = R.RESOURCE_KEY) AS AGENT_NAME
            , (SELECT M.MEDIA_NAME_CODE FROM MEDIA_TYPE M WHERE M.MEDIA_TYPE_KEY = X.MEDIA_TYPE_KEY ) as CHANNEL_TYPE
            , X.NAME AS STATE_NAME, SUM(STATE_RSN_TIME) AS STATE_TIME
            , X.DT_KEY, X.TENANT_KEY, X.RESOURCE_KEY, X.MEDIA_TYPE_KEY
            -- , (SELECT R.AGENT_LAST_NAME FROM resource_ R WHERE X.RESOURCE_KEY = R.RESOURCE_KEY) AS SITE_CD, 
            -- , X.RESOURCE_STATE_KEY, X.RESOURCE_STATE_REASON_KEY

    FROM (
            SELECT R.*, AC.NAME
                , (SELECT CONVERT(${date_type}, DT.CAL_DATE, 20) FROM DATE_TIME DT WHERE DT.DATE_TIME_KEY = R.DATE_TIME_KEY) AS DT_KEY
            FROM ${main_view_name} R, RESOURCE_STATE RST, RESOURCE_STATE_REASON RSR, GIDB_GC_ACTION_CODE AC
            WHERE R.TENANT_KEY = ${tenant_key} 
            AND R.DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
            AND RST.RESOURCE_STATE_KEY = 13
            AND R.RESOURCE_STATE_REASON_KEY = RSR.RESOURCE_STATE_REASON_KEY
            AND RSR.SOFTWARE_REASON_KEY = 'ReasonCode'
            AND AC.TENANTID = R.TENANT_KEY
            AND AC.CODE = RSR.SOFTWARE_REASON_VALUE
            -- AND R.RESOURCE_KEY IN (SELECT RESOURCE_KEY FROM RESOURCE_ WHERE RESOURCE_TYPE = 'Agent' AND AGENT_LAST_NAME = '${site_cd}')
            ${agent_group_query}
            ${agent_id_query}
    ) X
    WHERE 1=1
    ${media_type_query}
    ${time_range_query}
    GROUP BY X.DT_KEY, X.TENANT_KEY, X.RESOURCE_KEY, X.RESOURCE_STATE_KEY, X.MEDIA_TYPE_KEY, X.RESOURCE_STATE_REASON_KEY, X.NAME
    ;`
;
  
    console.log("[agent-states-infos] query: " + query);

    const rows = await sendPreparedStatementToInfomart(query)
    console.log("[agent-states-infos] result: " + JSON.stringify(rows));
    return rows;
    
};


module.exports = {
    getAgentNotReadyInfos
}