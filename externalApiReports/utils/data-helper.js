const {
    curry,
    indexBy,
    merge,
    prop,
    props,
    length,
    pipe,
    filter,
  } = require("ramda");
  

  const joinRight = curry((mapper1, mapper2, t1, t2) => {
    let indexed = indexBy(mapper1, t1);
    return t2.map(t2row => merge(t2row, indexed[mapper2(t2row)]));
  });
  
  const joinLeft = curry((f1, f2, t1, t2) => {
    return joinRight(f2, f1, t2, t1);
  });

  const addMetaData = curry(
    (originTableJoinKey, metaTableJoinKey, originTable, metaTable) => {
      return joinLeft(
        originTableJoinKey,
        metaTableJoinKey,
        originTable,
        metaTable
      );
    }
  );

const filterBy = curry((standard_column, queue_key) => filter(data => data[standard_column] == queue_key));
const filterNone = filter(() => true);
const filterTwoSlot = (slot1 = pass, slot2 = pass) => pipe(
  slot1,
  slot2,
);

const filterByRepNumber = filterBy('REP_INDEX'); 
const filterByServiceName = filterBy('SERVICE_INDEX'); 

const onVqKey = prop("VQ_KEY");
const onRepIndex = prop("REP_INDEX");
const onDTKeyAndRepIndex = props(["DT_KEY", "REP_INDEX"]);

const leftJoinOnVqKey = (left_table, right_table) => new Promise((resolve, reject) => {
  resolve(addMetaData(onVqKey, onVqKey)(left_table, right_table));
});
const leftJoinOnPrevMappingIndex = (left_table, right_table) => new Promise((resolve, reject) => {
  // resolve(addMetaData(onPrevMappingIndex, onMappingIndex)(left_table, right_table));
  resolve(addMetaData(onRepIndex, onRepIndex)(left_table, right_table));
});
const leftJoinOnDTKeyAndPrevMappingIndex = (left_table, right_table) => new Promise((resolve, reject) => {
  // resolve(addMetaData(onPrevMappingIndex, onMappingIndex)(left_table, right_table));
  resolve(addMetaData(onDTKeyAndRepIndex, onDTKeyAndRepIndex)(left_table, right_table));
});


const fulfillServiceReqData = function (data) {
  var fulfilled_data = data;

  for (var i = 0; i < length(data); i++) {
    if (typeof data[i].AGENT_QUEUE_ENTERED === "undefined") {
      fulfilled_data[i].SERVICE_CONNECT_REQ = 0;
    } else {
      fulfilled_data[i].SERVICE_CONNECT_REQ = data[i].AGENT_QUEUE_ENTERED;
    }

    fulfilled_data[i].IVR_ABANDONED = data[i].CONTACT_CENTER_ENTERED - data[i].SERVICE_CONNECT_REQ;
    if(fulfilled_data[i].IVR_ABANDONED < 0) fulfilled_data[i].IVR_ABANDONED = 0;
  }
  
  return fulfilled_data;
};
  
  module.exports = {
    addMetaData,
    filterByRepNumber,
    filterByServiceName,
    filterNone,
    filterTwoSlot,
    fulfillServiceReqData,
    leftJoinOnVqKey,
    leftJoinOnPrevMappingIndex,
    leftJoinOnDTKeyAndPrevMappingIndex
  };
  