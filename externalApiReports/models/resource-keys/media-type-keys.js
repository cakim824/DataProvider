// var logger = require('../../../utils/logger')({ dirname: '', filename: '', sourcename: 'interaction-types.controller.js' });
var { sendPreparedStatementToInfomart } = require("../../utils/mssql");

getMediaTypeKeys = async(media_type) => {
    
    var query =
    `
    SELECT  MEDIA_NAME_CODE, MEDIA_TYPE_KEY 
    FROM    MEDIA_TYPE
    WHERE   MEDIA_NAME = '${media_type}'
    ;`
    ;

    console.log(`[get][getMediaTypeKeys]: query = ` + query);
  
    const rows = await sendPreparedStatementToInfomart(query);

    var mediaType = rows;	
    media_type_keys =  ` (`	
    for(var i=0;  mediaType[i]; i++) {
      if(i==0) media_type_keys = media_type_keys + mediaType[i].MEDIA_TYPE_KEY;	
      else media_type_keys = media_type_keys + `, ` + mediaType[i].MEDIA_TYPE_KEY	
    }	 
    media_type_keys += `)` ;

    console.log("[media-types]" + media_type + " media_type_keys: " + media_type_keys);
    return media_type_keys;

};


module.exports = {
    getMediaTypeKeys,
}