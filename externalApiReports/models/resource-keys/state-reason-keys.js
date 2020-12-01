// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
const { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { sendPreparedStatementToPortalDB } = require('../../utils/mariadb');
const { getTimestamp } = require('../../utils/date');

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

getStateReasonKeys = async({ date_unit, site_cd, tenant_key, start_date, end_date }) => {
    
    const main_view_name = getViewName(date_unit);
    const start_timestamp = getTimestamp(start_date); 
    const end_timestamp = getTimestamp(end_date) + 85500;
    console.log('end_timestamp: ', end_timestamp, 'start_timestamp: ', start_timestamp);

    var query =
    `
    SELECT DISTINCT(AC.NAME)
    FROM ${main_view_name} R, RESOURCE_STATE RST, RESOURCE_STATE_REASON RSR, GIDB_GC_ACTION_CODE AC
    WHERE R.TENANT_KEY = ${tenant_key}
        AND R.DATE_TIME_KEY BETWEEN ${start_timestamp} AND ${end_timestamp}
        AND R.RESOURCE_KEY in (select resource_key from resource_ where resource_type='Agent' and agent_last_name = '${site_cd}')
        AND RST.RESOURCE_STATE_KEY = 13
        AND R.RESOURCE_STATE_REASON_KEY = RSR.RESOURCE_STATE_REASON_KEY
        AND RSR.SOFTWARE_REASON_KEY = 'ReasonCode'
        AND AC.TENANTID = R.TENANT_KEY
        AND AC.CODE = RSR.SOFTWARE_REASON_VALUE
    ;`
    ;

    const rows = await sendPreparedStatementToInfomart(query);
    console.log(`[getStateReasonKeys]: query = ` + query + "\n    rows: " + JSON.stringify(rows));

    var state_reason_keys = [];
    if (rows) {
        for(var i=0; rows[i]; i++) state_reason_keys.push(rows[i].NAME);
    }

    console.log("[getStateReasonKeys]state_reason_keys: " + state_reason_keys);
    return state_reason_keys;
};

getSiteReasonCodes = async(site_cd) => {
    
    var query =
    `
    SELECT  ROW_NUMBER() OVER(ORDER BY A.ACTION_CD) AS NUM, A.SITE_CD, A.ACTION_CD, A.REASON_CD
            , A.DISPLAY_NM AS STATE_NAME, A.DISPLAY_ENM AS STATE_ENAME
    FROM    tb_action_code_mapping A
    WHERE   (A.SITE_CD = 'Environment' OR A.SITE_CD = '${site_cd}')
        AND  A.USE_YN = 'Y'
        AND  A.REASON_CD IS NOT NULL
    ORDER BY NUM
    ;`
    ;

    console.log(`[get][getSiteActionCodes]: query = ` + query);
    const rows = await sendPreparedStatementToPortalDB({query});

    console.log(`[get][getSiteActionCodes]: rows = ` + rows);
    return rows;

};

module.exports = {
    getStateReasonKeys,
    getSiteReasonCodes
}