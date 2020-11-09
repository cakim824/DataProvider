var { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { getTimestamp } = require('../../utils/date');
// var logger = require("../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.js"
// });

var isNotEmpty = value => value != "";

const DATE_UNITS = {
    hourly: {
        date_type: "CHAR(16)",
        main_view_name: "AG2_AGENT_HOUR"
    },
    daily: {
        date_type: "CHAR(10)",
        main_view_name: "AG2_AGENT_DAY"
    },
    monthly: {
        date_type: "CHAR(7)",
        main_view_name: "AG2_AGENT_MONTH"
    }
};

const getViewName = date_unit => DATE_UNITS[date_unit].main_view_name;
const getDateType = date_unit => DATE_UNITS[date_unit].date_type;

var parameterTypes = {
  start_date: "VarChar",
  end_date: "VarChar",
  sms_start_date: "VarChar",
  sms_end_date: "VarChar",
  sms_tenant_key: "VarChar",
  sms_site_cd: "VarChar",
  tenant_key: "VarChar",
  site_cd: "VarChar",
  agent_group: "VarChar",
  agent_id: "VarChar",
  media_type: "VarChar",
  interaction_type: "Int",
  service_type: "VarChar",
  third_party_media: "VarChar"
};

const getAgentCenterOutputs = async ({ date_unit, tenant_key, site_cd, start_date, end_date, start_time, end_time, inbound_type_keys, outbound_type_keys }) => {

    const main_view_name = getViewName(date_unit);
    const date_type = getDateType(date_unit);

    const start_timestamp = getTimestamp(start_date); 
    const end_timestamp = getTimestamp(end_date) + 85500;
    console.log('end_date - start_date', end_timestamp, start_timestamp, end_timestamp - start_timestamp);

    var time_range_query = "";
    if (date_unit == "hourly" && isNotEmpty(start_time)) {
        time_range_query = `  AND RIGHT(X.DT_KEY, 5) BETWEEN '${start_time}' AND '${end_time}'`;
    }

    var parameters = {
        tenant_key,
        site_cd,
        start_date,
        end_date,   
        start_time,
        end_time
    };
  
    const query = `
    SET ANSI_WARNINGS OFF
    SET ARITHIGNORE ON
    SET ARITHABORT OFF

    SELECT  ROW_NUMBER() OVER(ORDER BY X.DT_KEY) AS NUM
            , LEFT(DT_KEY,10) AS DATE_KEY
            , (CASE WHEN LEN(X.DT_KEY) = 16 THEN RIGHT(DT_KEY, 5) ELSE '' END) AS TIME_KEY
            , SUM(X.IB_OFFERED) AS IB_OFFERED
            , SUM(X.IB_ENGAGE) AS IB_ENGAGE
            , ISNULL(ROUND(SUM(X.IB_ENGAGE)/SUM(X.IB_OFFERED)*100, 2), 0) AS IB_RESPONSE_RATE
            , SUM(X.OB_OFFERED) AS OB_OFFERED
            , SUM(X.OB_ENGAGE) AS OB_ENGAGE
            , ISNULL(ROUND(SUM(X.OB_ENGAGE)/SUM(X.OB_OFFERED)*100, 2), 0) AS OB_RESPONSE_RATE
            
    FROM (

    SELECT 
            -- ROW_NUMBER() OVER(ORDER BY ISNULL(T1.DT_KEY, T2.DT_KEY), ISNULL(T1.AGENT_NAME, T2.AGENT_NAME)) AS NUM
            ISNULL(T1.DT_KEY, T2.DT_KEY) AS DT_KEY
            , LEFT(ISNULL(T1.DT_KEY, T2.DT_KEY), 10) AS DATE_KEY
            , RIGHT(ISNULL(T1.DT_KEY, T2.DT_KEY), 5) AS TIME_KEY
            , ISNULL(T1.AGENT_NAME, T2.AGENT_NAME) AS AGENT_NAME

            , ISNULL(IB_OFFERED, 0) AS IB_OFFERED	-- IB요청건수
            , ISNULL(IB_ENGAGE, 0) AS IB_ENGAGE
            , ISNULL(IB_ENGAGE_TIME, 0) AS IB_ENGAGE_TIME
            , ISNULL(CONVERT(NUMERIC(13,2), ROUND((ISNULL(IB_ENGAGE, 0) / ISNULL(IB_OFFERED, 0) * 100) ,2)), 0) AS IB_RESPONSE_RATE  -- IB응대율

            , ISNULL(OB_OFFERED, 0) AS OB_OFFERED	-- OB요청건수
            , ISNULL(OB_ENGAGE, 0) AS OB_ENGAGE
            , ISNULL(OB_ENGAGE_TIME, 0) AS OB_ENGAGE_TIME
            , ISNULL(CONVERT(NUMERIC(13,2), ROUND((ISNULL(OB_ENGAGE, 0) / ISNULL(OB_OFFERED, 0) * 100) ,2)), 0) AS OB_RESPONSE_RATE  -- OB응대율
 
	FROM (SELECT (SELECT CONVERT(${date_type}, DT.CAL_DATE, 20)
                    FROM   DATE_TIME DT
                    WHERE  DT.DATE_TIME_KEY = A.DATE_TIME_KEY
                    ) as DT_KEY 
                   , B.AGENT_NAME AS AGENT_NAME
                   , SUM(A.OFFERED) as IB_OFFERED
                   , SUM(A.OFFERED) - SUM(A.ENGAGE) as IB_FAILED
                   , SUM(A.ENGAGE) as IB_ENGAGE
                   , SUM(A.ENGAGE_TIME) as IB_ENGAGE_TIME  
                   , SUM(A.TRANSFER_INIT_AGENT) as IB_TRANSFER_INIT_AGENT
                   , SUM(A.XFER_RECEIVED_ACCEPTED) as IB_XFER_RECEIVED_ACCEPTED 
           FROM ${main_view_name} A INNER JOIN
                   (SELECT DISTINCT A.RESOURCE_KEY, C.AGENT_FIRST_NAME as AGENT_NAME
                    FROM RESOURCE_GROUP_FACT_ A
                         INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
                         INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
                         INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
                    WHERE B.GROUP_TYPE ='Agent'

                      AND A.START_DATE_TIME_KEY <= ${start_timestamp}
                      AND A.END_DATE_TIME_KEY >= ${end_timestamp}
            
                      AND   A.ACTIVE_FLAG = 1
                      AND   T.TENANT_KEY = ${tenant_key}
                      AND   C.AGENT_LAST_NAME = '${site_cd}'
                       
                   ) B ON (A.RESOURCE_KEY = B.RESOURCE_KEY)
           WHERE  A.DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
                  AND A.MEDIA_TYPE_KEY = 1
                  AND A.INTERACTION_TYPE_KEY IN  ${inbound_type_keys}
           
           GROUP BY B.AGENT_NAME, A.DATE_TIME_KEY, A.MEDIA_TYPE_KEY, A.INTERACTION_TYPE_KEY
           ) T1

           FULL OUTER JOIN

         (SELECT (SELECT CONVERT(${date_type}, DT.CAL_DATE, 20)
                    FROM   DATE_TIME DT
                    WHERE  DT.DATE_TIME_KEY = A.DATE_TIME_KEY
                    ) as DT_KEY 
                    , B.AGENT_NAME AS AGENT_NAME
                    , SUM(A.OFFERED) as OB_OFFERED
                    , SUM(A.OFFERED) - SUM(A.ENGAGE) as OB_FAILED
                    , SUM(A.ENGAGE) as OB_ENGAGE
                    , SUM(A.ENGAGE_TIME) as OB_ENGAGE_TIME 
                    , SUM(A.TRANSFER_INIT_AGENT) as OB_TRANSFER_INIT_AGENT
                    , SUM(A.XFER_RECEIVED_ACCEPTED) as OB_XFER_RECEIVED_ACCEPTED
          FROM ${main_view_name} A INNER JOIN
                    (SELECT DISTINCT A.RESOURCE_KEY, C.AGENT_FIRST_NAME as AGENT_NAME
                    FROM RESOURCE_GROUP_FACT_ A
                            INNER JOIN GROUP_ B ON (A.TENANT_KEY = B.TENANT_KEY AND A.GROUP_KEY = B.GROUP_KEY)
                            INNER JOIN RESOURCE_ C ON (A.TENANT_KEY = C.TENANT_KEY AND A.RESOURCE_KEY = C.RESOURCE_KEY)
                            INNER JOIN TENANT T ON (A.TENANT_KEY = T.TENANT_KEY)
                    WHERE B.GROUP_TYPE ='Agent'

                      AND A.START_DATE_TIME_KEY <= ${start_timestamp}
                      AND A.END_DATE_TIME_KEY >= ${end_timestamp}

                      AND   A.ACTIVE_FLAG = 1
                      AND   T.TENANT_KEY = ${tenant_key}
                      AND   C.AGENT_LAST_NAME = '${site_cd}'
                        
                    ) B ON (A.RESOURCE_KEY = B.RESOURCE_KEY)
          WHERE  A.DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
                 AND A.MEDIA_TYPE_KEY = 1
                 AND A.INTERACTION_TYPE_KEY IN ${outbound_type_keys}
            
          GROUP BY B.AGENT_NAME, A.DATE_TIME_KEY, A.MEDIA_TYPE_KEY, A.INTERACTION_TYPE_KEY
          ) T2

          ON T1.DT_KEY = T2.DT_KEY AND T1.AGENT_NAME = T2.AGENT_NAME

    ) X
    WHERE 1=1
    ${time_range_query}

    GROUP BY DT_KEY
	ORDER BY NUM
    ; `
    ;
  
    const rows = await sendPreparedStatementToInfomart(query, parameters)
    console.log("[agent-total-outputs] query: " + query + "\n    parameters: " + JSON.stringify(parameters));
    console.log("[agent-outputs] result: " + JSON.stringify(rows));
    return rows;
    
};


module.exports = {
    getAgentCenterOutputs
}