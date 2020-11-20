// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
const { convertArgument } = require('../../utils/common');
const { sendPreparedStatementToPortalDB } = require('../../utils/mariadb');

getEnterQueueKeys = async({ site_cd, end_date }) => {
    
    var query =
    `
    SELECT  A.VQ_KEY AS ENTER_QUEUE_KEY
    FROM    tb_rp_vq_mapping_log_detail A
    WHERE   A.SITE_CD = '${site_cd}'
        AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = '${site_cd}' AND APPLY_DATE <= '${end_date}')
        AND ROUTING_POINT_TYPE = '0001'
        AND INFOMART_MODE = '00001'
    ;`
    ;

    console.log(`[getEnterQueueKeys]: query = ` + query);
  
    const rows = await sendPreparedStatementToPortalDB({query});

    var enter_queue_keys = "";
    for(var i=0;  rows[i]; i++) {
      if(i==0) enter_queue_keys = enter_queue_keys + rows[i].ENTER_QUEUE_KEY;	
      else enter_queue_keys = enter_queue_keys + `, ` + rows[i].ENTER_QUEUE_KEY	
    }	 

    console.log("[getEnterQueueKeys]: results = " + enter_queue_keys);
    return enter_queue_keys;

};

getConsultQueueKeys = async({ site_cd, end_date }) => {

    var query =
    `
    SELECT  A.VQ_KEY AS CONSULT_QUEUE_KEY
    FROM tb_rp_vq_mapping_log_detail A
    WHERE SITE_CD = '${site_cd}'
        AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = '${site_cd}' AND APPLY_DATE <= '${end_date}')
        AND ROUTING_POINT_TYPE = '0002'
        AND INFOMART_MODE = '00001'
    ;`
    ;

    console.log(`[getConsultQueueKeys]: query = ` + query);
  
    const rows = await sendPreparedStatementToPortalDB({query});

    var consult_queue_keys = "";
    for(var i=0;  rows[i]; i++) {
      if(i==0) consult_queue_keys = consult_queue_keys + rows[i].CONSULT_QUEUE_KEY;	
      else consult_queue_keys = consult_queue_keys + `, ` + rows[i].CONSULT_QUEUE_KEY	
    }	 

    console.log("[getConsultQueueKeys]: results = " + consult_queue_keys);
    return consult_queue_keys;
};


getSiteRepNumber =  async ( { site_cd, end_date, vq_key } ) => {
    try {

        console.log("[getSiteRepNumber] site_cd: " + site_cd + "\n    vq_key: " + vq_key);

        var vq_key_query = "";
        if (vq_key != '' && typeof vq_key != 'undefined') {
            console.log('vq_key ' + vq_key);
            vq_key_query = `AND A.VQ_KEY IN ( ${vq_key} ) `
        }

        var query = 
        `
        SELECT  A.MAPPING_INDEX AS REP_INDEX, A.VQ_KEY, A.SERVICE_NAME AS REP_NUMBER
                -- , (CASE WHEN A.PREV_MAPPING_INDEX IS NULL THEN A.SERVICE_NAME ELSE NULL END) AS REP_NUMBER
                -- , (SELECT VQ_KEY FROM tb_rp_vq_mapping_log_detail WHERE MAPPING_INDEX = A.PREV_MAPPING_INDEX) as PREV_VQ_KEY
        FROM tb_rp_vq_mapping_log_detail A
        WHERE A.SITE_CD = ?
            AND A.INFOMART_MODE = '00001'
            AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = ? AND APPLY_DATE <= ?)
            ${vq_key_query}
        ; `
        ;
    
        const params = [ site_cd, site_cd, end_date];
        const rows = await sendPreparedStatementToPortalDB({ query, params });
        
        console.log("[getSiteRepNumber] query: " + query + "\n    rows: " + JSON.stringify(rows));
        return rows;

    } catch (error) {
      throw error;
    }
  
};


getSiteServiceName =  async ( { site_cd, end_date, vq_key } ) => {
    try {

        console.log("[getSiteServiceName] site_cd: " + site_cd + "\n    vq_key: " + vq_key);

        var vq_key_query = "";
        if (vq_key != '' && typeof vq_key != 'undefined') {
            console.log('vq_key ' + vq_key);
            vq_key_query = `AND A.VQ_KEY IN ( ${vq_key} ) `
        }

        var query = 
        `
        SELECT  A.MAPPING_INDEX AS SERVICE_INDEX, A.VQ_KEY
                , (CASE WHEN A.PREV_MAPPING_INDEX IS NULL THEN NULL ELSE A.SERVICE_NAME END) AS SERVICE_NAME
                , A.PREV_MAPPING_INDEX AS REP_INDEX
                , (SELECT VQ_KEY FROM tb_rp_vq_mapping_log_detail WHERE MAPPING_INDEX = A.PREV_MAPPING_INDEX) as PREV_VQ_KEY
        FROM tb_rp_vq_mapping_log_detail A
        WHERE A.SITE_CD = ?
            AND A.INFOMART_MODE = '00001'
            AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = ? AND APPLY_DATE <= ?)
            ${vq_key_query}
        ; `
        ;
    
        const params = [ site_cd, site_cd, end_date];
        const rows = await sendPreparedStatementToPortalDB({ query, params });
        
        console.log("[getSiteServiceName] query: " + query + "\n    rows: " + JSON.stringify(rows));
        return rows;

    } catch (error) {
      throw error;
    }
  
};


module.exports = {
    getEnterQueueKeys,
    getConsultQueueKeys,
    getSiteRepNumber,
    getSiteServiceName
}