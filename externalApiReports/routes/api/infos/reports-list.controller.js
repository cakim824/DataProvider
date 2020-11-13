
const reportsList = [
    {
        "NUM": 1,
        "REPORTS_NAME": "센터 상담 실적 보고서",
        "REQUEST_URL_NAME": "agent-center-outputs"
    },
    {
        "NUM": 2,
        "REPORTS_NAME": "상담사 실적 보고서",
        "REQUEST_URL_NAME": "agent-outputs"
    },
    {
        "NUM": 3,
        "REPORTS_NAME": "상담그룹 실적 보고서",
        "REQUEST_URL_NAME": "agent-group-outputs"
    },
    {
        "NUM": 4,
        "REPORTS_NAME": "상담사 상태 실적 보고서",
        "REQUEST_URL_NAME": "agent-state-infos"
    },
    {
        "NUM": 5,
        "REPORTS_NAME": "상담사 일별 로그인 실적 보고서",
        "REQUEST_URL_NAME": "agent-daily-login-infos"
    }
];

const read = async (req, res, next) => {
    try {
        
        console.log('[reports-list.controller] reports_list: ' + JSON.stringify(reportsList));
        res.status(200).json(reportsList);

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