let currentTab = 0;
let currentSection = 0;
var tabList = [
    ["Agent","home"],
    ["Contracts","contract"],
    ["Factions","faction"],
    ["Fleet","ship"],
    ["System","galaxy"],
    ["Surveys","atom"]
];
function showTab()
{
    var div = document.querySelector(".tab-header");
    div.innerHTML = tabList.map(renderTab).join("");
    function renderTab(e,n)
    {
        return `
        <div class="tab icon icon-${e[1]} ${currentTab==n?"active":""}">${e[0]}</div>
        `;    
    };
    /*
    div.innerHTML = `
    <div class="tab icon icon-home ${currentTab==0?"active":""}">Agent</div>
    <div class="tab icon icon-contract ${currentTab==1?"active":""}">Contracts</div>
    <div class="tab icon icon-faction ${currentTab==2?"active":""}">Factions</div>
    <div class="tab icon icon-ship ${currentTab==3?"active":""}">Fleet</div>
    <div class="tab icon icon-galaxy ${currentTab==4?"active":""}">Systems</div>
`;*/
    initTab();
}
function showTabContent(data)
{
    var div = document.querySelector(".tab-content");
    dump(data);
    div.innerHTML = `
        <div class="content text-white icon icon-home ${currentTab==0?'active':''}">
            <table style="height:100%;width:100%">
                <tr>
                    <td colspan=2 valign=top>
                        <h2 class="listheader" onclick="refreshAgent()">Agent</h2>
                    </td>
                </tr>
                <tr>
                    <td colspan=2 valign=top>
                        ${agentInfo(data.agent)}
                    </td>
                </tr>
                <tr><td colspan=2></td></tr>
            </table>
        </div>
        <div class="content text-white icon icon-contract ${currentTab==1?'active':''}" onclick="selectContract()">
            ${panListDetail("Contrats",contractList(data.contracts),contractInfo(data.contract),"refreshContractList")}
        </div>
        <div class="content text-white icon icon-faction ${currentTab==2?'active':''}" onclick="selectFaction()">
            ${panListDetail("Factions",factionList(data.factions),factionInfo(data.faction),"refreshFactionList")}
        </div>
        <div class="content text-white icon icon-ship ${currentTab==3?'active':''}" onclick="selectShip()">
            ${panListDetail("Fleet",shipList(data.fleet),shipInfo(data.ship),"refreshFleetList")}
        </div>
        <div class="content text-white icon icon-galaxy ${currentTab==4?'active':''}" onclick="selectSystem()">
            ${panListDetail("System",systemList(data.systems),systemInfo(data.system),"refreshSystemList")}
        </div>
        <div class="content text-white icon icon-atom ${currentTab==5?'active':''}" onclick="selectSurvey()">
            ${panListDetail("Surveys",surveyList(data.surveys),surveyInfo(data.survey),"refreshSurvey")}
        </div>
        `;
    initSect();

    function panListDetail(title,listgen,detailgen,refreshcallback)
    {
        return `
        <div class="flex-row" style="height:100%;width:95%;">
            <div><h1 class="listheader" onclick="${refreshcallback}()">${title}</h1></div>
            <div class="flex-col" style="flex:auto;">
                <div class="listscroll" style="height:98%;overflow-y:scroll;">
                    ${listgen}
                </div>
                <div class="listdetail" style="height:98%;overflow-y:scroll;">
                    ${detailgen}
                </div>
            </div>
        </div>
    `;
    }
}

function initTab(){
    function _class(name)
    {
        return document.querySelectorAll("."+name);
    }

    let tabPanes = _class("tab-header")[0].querySelectorAll("div");
    for (let i=0; i < tabPanes.length; i++)
    {
        tabPanes[i].addEventListener("click",function(){
            currentTab = i;
            _class("tab-header")[0].querySelectorAll(".tab.active")[0].classList.remove("active");
            tabPanes[i].classList.add("active");
            _class("tab-indicator")[0].style.top = `${i*48}px`;
            var currentActive = _class("tab-content")[0].querySelectorAll(".content.active")[0];
            if (currentActive) currentActive.classList.remove("active");
            let current = _class("tab-content")[0].querySelectorAll("div.content")
            if (current.length>0) current[i].classList.add("active");
        });
    };
}

function initSect(){
    function _class(name)
    {
        return document.getElementsByClassName(name);
    }
    let tabPanes = _class("section-header")[0].querySelectorAll("div");
    for (let i=0; i < tabPanes.length; i++)
    {
        tabPanes[i].addEventListener("click",function(){
            currentSection = i;
            _class("section-header")[0].querySelectorAll(".sect.active")[0].classList.remove("active");
            tabPanes[i].classList.add("active");
            var currentActive = _class("section-content")[0].querySelectorAll(".section.active")[0]
            if (currentActive) currentActive.classList.remove("active");
            let current = _class("section-content")[0].querySelectorAll("div.section")
            current[i].classList.add("active");
        });
    };
}
