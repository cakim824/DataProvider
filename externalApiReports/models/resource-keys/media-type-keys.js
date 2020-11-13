// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
const { sendPreparedStatementToInfomart } = require("../../utils/mssql");
const { sendPreparedStatementToPortalDB } = require('../../utils/mariadb');

getMediaTypeKeys = async({ site_cd, media_type }) => {
    
    var media_type_query = "";
    if (media_type != '' && typeof media_type != 'undefined') {
        console.log('media_type ' + media_type);
        media_type_list = `'` + media_type.replace(/,/g, '\', \'') + `'`;
        media_type_query = `AND  B.MEDIA_TYPE_NM IN ( ${media_type_list} )`
    }

    var query =
    `
    SELECT  B.MEDIA_TYPE_CD as MEDIA_TYPE_KEY
            , B.MEDIA_TYPE_NM as MEDIA_TYPE_NAME
            , B.THIRD_PARTY_MEDIA_YN
    FROM    tb_site_media_type A
            INNER JOIN tb_media_type B ON (A.MEDIA_TYPE_CD = B.MEDIA_TYPE_CD AND A.THIRD_PARTY_MEDIA_YN = B.THIRD_PARTY_MEDIA_YN)
    WHERE   A.SITE_CD = '${site_cd}'
    ${media_type_query}
    ;`
    ;

    console.log(`[get][getMediaTypeKeys]: query = ` + query);
  
    const rows = await sendPreparedStatementToPortalDB({query});

    var media_type_keys = "";
    for(var i=0;  rows[i]; i++) {
      if(i==0) media_type_keys = media_type_keys + rows[i].MEDIA_TYPE_KEY;	
      else media_type_keys = media_type_keys + `, ` + rows[i].MEDIA_TYPE_KEY	
    }	 

    console.log("[media-types]" + media_type + " media_type_keys: " + media_type_keys);
    return media_type_keys;

};

getSiteMediaTypeKeys = async(site_cd) => {
    
    var query =
    `
    SELECT  ROW_NUMBER() OVER(ORDER BY B.MEDIA_TYPE_CD) AS NUM
            -- B.MEDIA_TYPE_CD as MEDIA_TYPE_CODE
            , B.MEDIA_TYPE_NM as CHANNEL_TYPE
            -- , B.THIRD_PARTY_MEDIA_YN
    FROM    tb_site_media_type A
            INNER JOIN tb_media_type B ON (A.MEDIA_TYPE_CD = B.MEDIA_TYPE_CD AND A.THIRD_PARTY_MEDIA_YN = B.THIRD_PARTY_MEDIA_YN)
    WHERE  A.SITE_CD = '${site_cd}'
    ;`
    ;

    console.log(`[get][getMediaTypeKeys]: query = ` + query);
  
    const rows = await sendPreparedStatementToPortalDB({query});

    console.log(`[get][getMediaTypeKeys]: rows = ` + rows);
    return rows;

};

module.exports = {
    getMediaTypeKeys,
    getSiteMediaTypeKeys
}