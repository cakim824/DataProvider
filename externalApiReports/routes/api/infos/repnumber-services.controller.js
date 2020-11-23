
const { getSiteRepNumber, getSiteServiceName } = require('../../../models/resource-keys/queue-resource-keys.js');
const { getMappingIndex } = require('../../../utils/data-helper');
const { convertArgument } = require('../../../utils/common');  

const {
    length,
    omit,
  } = require('ramda')

const omitColumn = async (data) => {

    var filtered_data = new Array();
    for(var i=0; i<length(data); i++) {
      filtered_data[i] = omit(['VQ_KEY', 'PREV_VQ_KEY', 'REP_INDEX', 'SERVICE_INDEX'], data[i]);
    }
  
    return filtered_data;
};


const readRepnumbers = async (req, res, next) => {
    try {
        const param = req.query || {};
        const site_cd = req.params.site_cd;
        const apply_date = param.applydate;
        console.log('[readRepnumbers] site_cd: ' + site_cd + '\napply_date: ' + apply_date );

        const repnumber_infos = await getSiteRepNumber({ site_cd, apply_date });
        console.log('[readRepnumbers] repnumber_infos: ' + JSON.stringify(repnumber_infos));

        const final_repnumber_infos = await omitColumn(repnumber_infos)
        console.log('[readRepnumbers] final_repnumber_infos: ' + JSON.stringify(final_repnumber_infos));
        
        res.status(200).json(final_repnumber_infos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
    }
};


const readServices = async (req, res, next) => {
    try {
        const param = req.query || {};
        const site_cd = req.params.site_cd;
        const apply_date = param.applydate;
        console.log('[readServices] site_cd: ' + site_cd + '\napply_date: ' + apply_date);

        var rep_number_index = '';
        if (param.repnumber) {
            rep_number = convertArgument(param.repnumber);
            console.log('[readServices] rep_number: ' + rep_number );
            const enter_queue_info = await getSiteRepNumber({ site_cd, apply_date });
            rep_number_index = await getMappingIndex({ data: enter_queue_info, service_name: rep_number });
            console.log("[readServices] rep_number_index : " + rep_number_index);
        }

        const service_infos = await getSiteServiceName({ site_cd, apply_date, rep_number_index });
        console.log('[readServices] service_infos: ' + JSON.stringify(service_infos));

        const final_service_infos = await omitColumn(service_infos);
        console.log('[readServices] final_service_infos: ' + JSON.stringify(final_service_infos));
        
        res.status(200).json(final_service_infos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
    }
};

  
module.exports = {
    readRepnumbers,
    readServices
}