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


getSiteRepNumber =  async ( { site_cd, apply_date } ) => {
    try {
        console.log("[getSiteRepNumber] site_cd: " + site_cd + "\n    apply_date: " + apply_date);

        var apply_date_query = ` AND APPLY_DATE <= DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') `;
        if (apply_date != '' && typeof apply_date != 'undefined') {
            console.log('apply_date ' + apply_date);
            apply_date_query = ` AND APPLY_DATE <= ${apply_date} ` 
        }

        var query = 
        `
        SELECT  ROW_NUMBER() OVER(ORDER BY REP_NUMBER) AS NUM
                , A.SERVICE_NAME AS REP_NUMBER
                , A.MAPPING_INDEX AS REP_INDEX, A.VQ_KEY
        FROM tb_rp_vq_mapping_log_detail A
        WHERE A.SITE_CD = ?
            AND A.ROUTING_POINT_TYPE = '0001'
            AND A.INFOMART_MODE = '00001'
            AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = ? ${apply_date_query} )
        ORDER BY NUM
        ; `
        ;
    
        const params = [ site_cd, site_cd ];
        const rows = await sendPreparedStatementToPortalDB({ query, params });
        
        console.log("[getSiteRepNumber] query: " + query + "\n    rows: " + JSON.stringify(rows));
        return rows;

    } catch (error) {
      throw error;
    }
  
};


getSiteServiceName =  async ( { site_cd, apply_date, rep_number_index } ) => {
    try {

        console.log("[getSiteServiceName] site_cd: " + site_cd + "\n    apply_date: " + apply_date);

        var apply_date_query = ` AND APPLY_DATE <= DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') `;
        if (apply_date != '' && typeof apply_date != 'undefined') {
            console.log('apply_date ' + apply_date);
            apply_date_query = ` AND APPLY_DATE <= ${apply_date} ` 
        }

        var prev_mapping_query = "";
        if (rep_number_index != '' && typeof rep_number_index != 'undefined') {
            console.log('rep_number_index ' + rep_number_index);
            prev_mapping_query = `AND A.PREV_MAPPING_INDEX = ${rep_number_index} `
        }

        var query = 
        `
        SELECT  ROW_NUMBER() OVER(ORDER BY REP_NUMBER, SERVICE_NAME) AS NUM
                , (SELECT SERVICE_NAME FROM tb_rp_vq_mapping_log_detail WHERE MAPPING_INDEX = A.PREV_MAPPING_INDEX) as REP_NUMBER
                , (CASE WHEN A.PREV_MAPPING_INDEX IS NULL THEN NULL ELSE A.SERVICE_NAME END) AS SERVICE_NAME
                , A.MAPPING_INDEX AS SERVICE_INDEX, A.VQ_KEY
                , A.PREV_MAPPING_INDEX AS REP_INDEX
                , (SELECT VQ_KEY FROM tb_rp_vq_mapping_log_detail WHERE MAPPING_INDEX = A.PREV_MAPPING_INDEX) as PREV_VQ_KEY
        FROM tb_rp_vq_mapping_log_detail A
        WHERE A.SITE_CD = ?
        AND A.ROUTING_POINT_TYPE = '0002'
            AND A.INFOMART_MODE = '00001'
            AND A.APPLY_DATE = (SELECT MAX(APPLY_DATE) FROM tb_rp_vq_mapping_log WHERE SITE_CD = ? ${apply_date_query} )
            ${prev_mapping_query}
        ORDER BY NUM
        ; `
        ;
    
        const params = [ site_cd, site_cd ];
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