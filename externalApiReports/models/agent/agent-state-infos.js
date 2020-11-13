var { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { getTimestamp } = require('../../utils/date');

var isNotEmpty = value => value != "";

const DATE_UNITS = {
    hourly: {
        date_type: "CHAR(16)",
        main_view_name: "AG2_I_SESS_STATE_HOUR"
    },
    daily: {
        date_type: "CHAR(10)",
        main_view_name: "AG2_I_SESS_STATE_DAY"
    },
    monthly: {
        date_type: "CHAR(7)",
        main_view_name: "AG2_I_SESS_STATE_MONTH"
    }
};

const getViewName = date_unit => DATE_UNITS[date_unit].main_view_name;
const getDateType = date_unit => DATE_UNITS[date_unit].date_type;

const getAgentStateInfos = async ({ date_unit, tenant_key, site_cd, group_key, agent_key, media_type_key, start_date, end_date, start_time, end_time }) => {

    const main_view_name = getViewName(date_unit);
    const date_type = getDateType(date_unit);

    const start_timestamp = getTimestamp(start_date); 
    const end_timestamp = getTimestamp(end_date) + 85500;
    console.log('end_timestamp: ', end_timestamp, 'start_timestamp: ', start_timestamp);

    var media_type_query = "";
    var agent_group_query = "";
    var agent_id_query = "";
    var time_range_query = "";

    if (isNotEmpty(media_type_key)) {
        media_type_query = ` AND A.MEDIA_TYPE_KEY IN (${media_type_key})`;
    }
    if (isNotEmpty(group_key)) {
        agent_group_query = ` AND B.GROUP_KEY = ${group_key}`;
    }
    if (isNotEmpty(agent_key)) {
        agent_id_query = ` AND A.RESOURCE_KEY = ${agent_key}`;
    }
    if ( date_unit == "hourly" && isNotEmpty(start_time) ) {
        time_range_query = ` AND RIGHT(Y.DT_KEY, 5) BETWEEN '${start_time}' AND '${end_time}'`;
    }
  
    const query = `
    SET ANSI_WARNINGS OFF
    SET ARITHIGNORE ON
    SET ARITHABORT OFF
    
    SELECT 
            ROW_NUMBER() OVER(ORDER BY Y.DT_KEY, Y.AGENT_NAME) AS NUM
            , LEFT(Y.DT_KEY, 10) AS DATE_KEY 
            , (CASE WHEN LEN(Y.DT_KEY) = 16 THEN RIGHT(Y.DT_KEY, 5) ELSE '' END) AS TIME_KEY
            , Y.M_TYPE AS CHANNEL_TYPE
            , Y.AGENT_NAME, Y.ACTIVE_TIME, Y.READY_TIME, Y.BUSY_TIME, Y.NOT_READY_TIME, Y.WRAP_TIME
    FROM (
        SELECT 
            (SELECT CONVERT(${date_type}, DT.CAL_DATE, 20) FROM   DATE_TIME DT WHERE  DT.DATE_TIME_KEY = A.DATE_TIME_KEY) as DT_KEY
            , B.AGENT_NAME
            , (SELECT M.MEDIA_NAME_CODE FROM MEDIA_TYPE M WHERE M.MEDIA_TYPE_KEY = A.MEDIA_TYPE_KEY ) as M_TYPE
            , A.ACTIVE_TIME -- Session 유지시간
            , A.READY_TIME  -- 대기시간
            , A.BUSY_TIME   -- 처리소요시간
            , A.NOT_READY_TIME -- 이석시간
            , A.WRAP_TIME    -- 후처리 시간
            , A.BUSY	
            , A.WRAP
        FROM  ${main_view_name} A
            , ( SELECT DISTINCT A.RESOURCE_KEY, C.AGENT_FIRST_NAME as AGENT_NAME, C.EMPLOYEE_ID 
                FROM RESOURCE_GROUP_FACT_ A, GROUP_ B, RESOURCE_ C, TENANT T
                WHERE A.GROUP_KEY = B.GROUP_KEY
                AND   A.TENANT_KEY = T.TENANT_KEY
                AND   B.TENANT_KEY = T.TENANT_KEY
                AND   C.TENANT_KEY = T.TENANT_KEY
                AND   A.RESOURCE_KEY = C.RESOURCE_KEY
                AND   A.START_DATE_TIME_KEY <= ${start_timestamp}
                AND   A.END_DATE_TIME_KEY >= ${end_timestamp}
                AND T.TENANT_KEY = ${tenant_key}
                AND C.AGENT_LAST_NAME = '${site_cd}'
                ${agent_group_query}
                ${agent_id_query}
            ) B
        WHERE A.RESOURCE_KEY = B.RESOURCE_KEY
            AND  A.DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
            ${media_type_query}
    
        
    ) Y
    WHERE 1=1
    ${time_range_query}
    ;`
    ;
  
    console.log("[agent-states-infos] query: " + query);

    const rows = await sendPreparedStatementToInfomart(query)
    console.log("[agent-states-infos] result: " + JSON.stringify(rows));
    return rows;
    
};


module.exports = {
    getAgentStateInfos
}