
const { getSiteMediaTypeKeys } = require('../../../models/resource-keys/media-type-keys.js');
  
const read = async (req, res, next) => {
    try {

        const site_cd = req.params.site_cd;
        console.log('[group-code.controller] site_cd: ' + site_cd );

        var channel_infos = await getSiteMediaTypeKeys( site_cd );
        console.log('[group-code.controller] channel_type: ' + JSON.stringify(channel_infos));
        
        res.status(200).json(channel_infos);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            errorCode: 500,
            errorMessage: '문제가 발생했습니다.'
        });
    }
};
  
  module.exports = {
    read
  }