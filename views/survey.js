function surveyList(list) {
    return list.map(listItem).join("");
    function listItem(item) {
        return `<div data-survey="${item.signature}">${item.symbol}</div>`;
    }
}
function surveyInfo(survey) {
    if (!survey) return "";
    return `
    <div>${survey.symbol}</div>
    <div>exp:${dt(survey.expiration)}</div>
    <br>
    <p><table>${survey.deposits.map(depositInfo).join("")}</table></p>
    `;
    function depositInfo(e)
    {
        return `
<p>${e.symbol}</p>
        `;
    }
}

function selectSurvey()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-survey");
    if (selection!=null)
    {
        var ndx = findSurveyIndex(selection);
        if (ndx>=0)
        {
            state.current.surveyIndex = ndx;
            state.survey = state.surveys[state.current.surveyIndex];
            refresh();
        }
    }
}
function findSurveyIndex(sel)
{
    return (state.surveys.map((e,n)=>({n:n,e:e})).filter(e=>e.e.signature==sel)||[{n:-1}])[0].n;
}
