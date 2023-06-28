function surveyList(list) {
    if (!list) return "";
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
        var ndx = findSurveySignatureIndex(selection);
        if (ndx>=0)
        {
            state.current.surveyIndex = ndx;
            state.survey = state.surveys[state.current.surveyIndex];
            redrawTabs();
        }
    }
}
function findSurveySignatureIndex(sel)
{
    if (!state.surveys) return -1;
    return (state.surveys.map((e,n)=>({n:n,e:e})).filter(e=>e.e.signature==sel)[0]||{n:-1}).n;
}
function findSurveySymbolIndex(sel)
{
    if (!state.surveys) return -1;
    return (state.surveys.map((e,n)=>({n:n,e:e})).filter(e=>e.e.symbol==sel)[0]||{n:-1}).n;
}

function refreshSurvey()
{
    
}