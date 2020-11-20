const { sendPreparedStatementToInfomart } = require('../../utils/mssql');
const { getTimestamp } = require('../../utils/date');

// const logger = require("../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "v3/consult-connect-queue.js"
// });

const DATE_UNITS = {
  hourly: { 
    view_name: 'AG2_QUEUE_HOUR',
    date_type: "CHAR(16)",
  },
  daily: { 
    view_name: 'AG2_QUEUE_DAY',
    date_type: "CHAR(10)",
  },
  monthly: { 
    view_name: 'AG2_QUEUE_MONTH',
    date_type: "CHAR(7)",
  }
}

const getViewName = date_unit => DATE_UNITS[date_unit].view_name;
const getDateType = date_unit => DATE_UNITS[date_unit].date_type;

const find = async ({ site_cd, date_unit, start_date, end_date, start_time, end_time, consult_queue_key }) => {

  const view_name = getViewName(date_unit);
  const date_type = getDateType(date_unit);

  var time_query = ''
  if ( date_unit=="hourly" && start_time != "" ) {
    time_query = `  AND RIGHT(X.DT_KEY, 5) BETWEEN '${start_time}' AND '${end_time}'`;
  }

  const query = `
  SET ANSI_WARNINGS OFF
  SET ARITHIGNORE ON
  SET ARITHABORT OFF

  SELECT 
          ROW_NUMBER() OVER(ORDER BY X.DT_KEY) AS NUM
          , X.DT_KEY
          , LEFT(X.DT_KEY,10) AS DATE_KEY
          , (CASE WHEN LEN(X.DT_KEY) = 16 THEN RIGHT(X.DT_KEY, 5) ELSE '' END) AS TIME_KEY
          , X.SERVICE_RESOURCE_KEY AS VQ_KEY
          , X.AGENT_QUEUE_ENTERED
          , X.AGENT_CONNECTED
          , X.AGENT_QUEUE_ABANDONED
          , X.AGENT_RING_ABANDONED
          , X.SYSTEM_ABANDONED
          , X.FORWARDED
          , X.MAX_WAITING_TIME
          , X.RESPONSE_RATE

  FROM (
  SELECT T1.DATE_TIME_KEY
       , T1.RESOURCE_KEY AS SERVICE_RESOURCE_KEY
       , (SELECT CONVERT(${date_type}, DT.CAL_DATE, 20) FROM DATE_TIME DT WHERE  DT.DATE_TIME_KEY = T1.DATE_TIME_KEY ) as DT_KEY 
       -- , (SELECT CONVERT(${date_type}, (SELECT DATEADD(SECOND, T1.DATE_TIME_KEY, '01/01/1970 09:00:00')), 121)) AS DATE_KEY
       -- , (SELECT CONVERT(VARCHAR(5), (SELECT DATEADD(SECOND, T1.DATE_TIME_KEY, '01/01/1970 09:00:00')), 108)) AS TIME_KEY
  	   , SUM(T1.ENTERED) - SUM(T1.REDIRECTED) AS AGENT_QUEUE_ENTERED
       , SUM(T1.ACCEPTED_AGENT) AS AGENT_CONNECTED
       , SUM(T1.ABANDONED) AS AGENT_QUEUE_ABANDONED
       , SUM(T1.ABANDONED_INVITE) AS AGENT_RING_ABANDONED
       , SUM(T1.CLEARED) AS SYSTEM_ABANDONED
       , SUM(T1.ROUTED_OTHER) AS FORWARDED
       , MAX(T1.ACCEPTED_TIME_MAX) AS MAX_WAITING_TIME
       , ISNULL(CONVERT(NUMERIC(13,2), ROUND((SUM(T1.ACCEPTED_AGENT) / (SUM(T1.ENTERED) - SUM(T1.REDIRECTED)) * 100) ,2)), 0.00) AS RESPONSE_RATE
  FROM   ${view_name} T1
  WHERE  T1.DATE_TIME_KEY BETWEEN @start_timestamp AND @end_timestamp
  AND    T1.RESOURCE_KEY IN (${consult_queue_key})
  GROUP BY T1.DATE_TIME_KEY, T1.RESOURCE_KEY
  ) X
  WHERE 1=1
  ${time_query}
  ;
  `;

  const parameter_types = {
    start_timestamp: "Int",
    end_timestamp: "Int"
  };

  const parameters = {
    start_timestamp: getTimestamp(start_date),
    end_timestamp:  getTimestamp(end_date) + 85500
  };

  console.log("[consult-connect-queue] query: " + query + "\n    parameters: " + JSON.stringify(parameters));
  const rows = await sendPreparedStatementToInfomart(query, parameters, parameter_types);
  
  // const date_format = await getDateFormat(date_unit);
  // const dt_key_added_rows = await addDtKeyColumnTo(rows, date_format);

  // console.log("[consult-connect-queue] dt_key_added_rows: " + JSON.stringify(dt_key_added_rows));
  // return dt_key_added_rows;

  return rows;
};

module.exports = {
  find,
}