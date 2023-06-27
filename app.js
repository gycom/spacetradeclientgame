let state = null;
let agents = [];
let nextReset = null;
function bodyLoad()
{
    try {document.getElementById("login").focus();} catch(err){} // ready to login
    getStatus((response)=>{
        links(response);
        serverstatus(response);
        leaderboard(response);
        buildAgentCombo();
    })
}

function getStatus(callback,callerror)
{
    // API: Get Status
    API_GET("",(response)=>{
        links(response);
        serverstatus(response);
        leaderboard(response);
        callback(response);
    },(response)=>{
        callerror(response); // token must be expired
    });
}



function acceptContract(contractId)
{
    API_POST(`my/contracts/${contractId}/accept`,{/*contractId:contractId*/},(response)=>{
        if (response.error) 
        {
            if (response.error.code==4501) // already accepted... oups!!
            {
                API_GET("my/contracts",(response)=>{
                    dump(response);
                    state.contracts=response.data;
                    state.contract=state.contracts[0];
                    state.current.contractIndex=0;
                });
            }
        }
        else
        {
            var index = state.contracts.reduce((t,e,n)=>{
                //console.log("search existing", response.data.contract.id,e.id,n);
                if (response.data.contract.id==e.id) 
                    return n;
                else
                    return t;
            },-1);
            if (index>=0) {
                if (response.data.contract)
                {
                    state.contracts[index] = response.data.contract;
                    state.contract = response.data.contract;
                    state.current.contractIndex = index;
                }
                else
                {
                    //console.log(response.data.contract,response.data,data,state)
                }
            }
            else
            {
                state.contracts=[];
                state.contracts.push(response.contract);
                state.contract = response.contract;
                state.current.contractIndex = 0;
            }
        
        }
        keepState();
        redrawTabs();
    });
}

function goOrbit(shipname)
{
    API_POST(`my/ships/${shipname}/orbit`,null,(response)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = response.data.nav;
        state.ship.nav = response.data.nav;
        keepState();
        redrawTabs();
    })
}
function goDock(shipname)
{
    API_POST(`my/ships/${shipname}/dock`,null,(response)=>{
        var ndx = findShipIndex(shipname);
        state.fleet[ndx].nav = response.data.nav;
        state.ship.nav = response.data.nav;
        keepState();
        redrawTabs();
    })
}
function navigateShip(shipname,waypoint)
{
    API_POST(`my/ships/${shipname}/navigate`,{waypointSymbol:waypoint},(response)=>{
        if (response.data.fuel) {state.ship.fuel = response.data.fuel; refreshFuel(state.ship.fuel);}
        if (response.data.nav)  {state.ship.nav = response.data.nav;   refreshNav(state.ship.nav);}
        state.fleet[findShipIndex(state.ship.symbol)] = state.ship;
        currentTab = 3;
        currentSection = 0;
        keepState();
        redrawTabs();
    })
}
function scanWaypoint(shipname,waypoint)
{
    API_POST(`my/ships/${shipname}/scan/waypoints`,null,(response)=>{
        //state.
        keepState();
        redrawTabs();
    })
}


function createSurvey(shipname)
{
    API_POST(`my/ships/${shipname}/survey`,null,(response)=>{
        if (!state.surveys) state.surveys = [];
        state.surveys = state.surveys.concat(response.data.surveys);
        setCooling(shipname,response.data.cooldown.totalSeconds);
        keepState();
        redrawTabs();
    })
}
var lastSurvey;
function refreshCargo(shipname,surveydata)
{
    API_GET(`/my/ships/${shipname}/cargo`,(response)=>{
        state.ship.cargo = response.data;
        state.fleet[state.current.shipIndex] = state.ship;
        keepState();
        currentSection = 8;
        dropIrrelevantCargo(shipname);
        redrawTabs();
    })
}

function extractResource(shipname,surveydata)
{
    lastSurvey = surveydata;
    API_POST(`my/ships/${shipname}/extract`,JSON.parse(unescape(surveydata)),(response)=>{
        setCooling(shipname,response.data.cooldown.totalSeconds,()=>{extractResource(shipname,surveydata)});
        refreshCargo(shipname,surveydata);
    })
}
var waste=[];
function dropIrrelevantCargo(shipname)
{
    waste = state.ship.cargo.inventory
                .filter(e=>!state.contract.terms.deliver.map(d=>d.tradeSymbol).includes(e.symbol))
                .map(e=>({symbol:e.symbol,units:e.units}));
    if (waste.length>0)
        setTimeout(()=>{
            var material = waste.shift();
            if (material)
            {
                dropCargo(shipname,material.units,material.symbol);
                dropIrrelevantCargo(shipname);
            }
        },5000);
}
function dropCargo(shipname,unit,elementSymbol)
{
    API_POST(`my/ships/${shipname}/jettison`,{
        symbol:elementSymbol,
        units:unit
    },(response) => {
        console.log(response);
        refreshCargo(shipname);
    });
}

function reviveCooldown()
{
    state.fleet.forEach(ship=> {
        console.log("check cooldown for ",ship.symbol);
        API_GET(`my/ships/${ship.symbol}/cooldown`,(response)=>{
            setCooling(ship.symbol,response.data.remainingSeconds);
        },(response)=>{
            if (response.error)
                console.log(response.error.message);
        })
    })
}

window.setInterval(tick,1000);
function now()
{
    return (new Date()).getTime();
}
function tick()
{
    Object.keys(cooling).forEach(shipSymbol=>{
        var delta = Math.floor(((cooling[shipSymbol].end - now()) / (cooling[shipSymbol].max*1000)) * cooling[shipSymbol].max) ;
        //console.log("tick",delta,shipSymbol,cooling[shipSymbol]);
        if (delta<0) delta = 0;
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = `<div style="90vw;background-color:white;height:20px;">
        <div style="height:100%;background-color:red;width:${delta}%">${delta}</div>
        </div>`;

        })
}
var cooling = {};

function setCooling(shipSymbol,cooldown,restart)
{
    console.log("set cooling at ", cooldown);
    if (!cooling[shipSymbol]) cooling[shipSymbol] = {max:0,timer:null};
    cooling[shipSymbol].max = cooldown;
    cooling[shipSymbol].start = now();
    cooling[shipSymbol].end = now() + cooldown*1000;
    cooling[shipSymbol].timer = setTimeout(()=>showCoolDown(shipSymbol),cooldown * 1000);
    var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
    if (engineTemp==null) {
        engineTemp = document.createElement("div");
        engineTemp.id =`engineTemp${shipSymbol}`;
        document.getElementById("engineTemp").appendChild(engineTemp);
    }
    engineTemp.innerHTML = `<div style="90vw;background-color:white;height:20px;">
    <div style="height:100%;background-color:red;width:100%">${cooldown}</div>
    </div>`;

    function showCoolDown(shipSymbol)
    {
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = "";
        //window.clearTimeOut(cooling[shipSymbol].timer);
        delete cooling[shipSymbol];
        if (restart) window.setTimeout(restart,1000);
    }
}

function cancelRestart(shipSymbol)
{
    if (cooling[shipSymbol])
    {
        window.clearTimeout(cooling[shipSymbol].timer);
        var engineTemp = document.getElementById(`engineTemp${shipSymbol}`);
        engineTemp.innerHTML = "";

    }
}



function d(date)
{
    return (new Date(date)).toLocaleDateString();
}
function dt(date)
{
    return (new Date(date)).toLocaleDateString() + " @ " + (new Date(date)).toLocaleTimeString();
}

function start()
{
    if (localStorage.getItem("SpaceTradersData")==null)
    {
        document.getElementById("registration").classList.add("notlogged");
        return;
    }
    state = JSON.parse(localStorage.getItem("SpaceTradersData"));
    if (!state.token) 
    {
        document.getElementById("registration").classList.add("notlogged");
        return;
    }

    document.getElementById("registration").classList.remove("notlogged");

    keepState();
    redrawTabs();
    reviveCooldown();
}
function keepState()
{
    localStorage.setItem("SpaceTradersData",JSON.stringify(state));
}
function redrawTabs()
{
    showTab();
    showTabContent(state);
}

function logout()
{
    document.getElementById("registration").classList.add("notlogged");
    var div = document.querySelector(".panel");
    div.innerHTML = `
<div class="tabs">
    <div class="tab-header">
    </div>
    <div class="tab-indicator"></div>
    <div class="tab-content">
    </div>
</div>
`;
    bodyLoad();
}




function dump(objectvalue) // for debugging
{
    let pre = document.getElementById("tempdata");
    if (pre){
        if (typeof(objectvalue)=="string")
            pre.innerHTML = objectvalue;
        else
        {
            if (typeof(objectvalue)=="object")
            {
                pre.innerHTML = JSON.stringify(objectvalue,null,2);
            }
        }
    }
}

function register()
{
    delete state.token;
    const body = {
        faction:document.getElementById("faction").value,
        symbol: document.getElementById("symbol").value,
        email:  document.getElementById("email").value
    };
    API_POST("register", body, response =>
    {
        console.log(response)
        if (response.error)
        {
            var span = document.getElementById("loginerror");
            switch(response.error.code)
            {
                case 4109:
                    span.innerHTML = "Agent symbol has already been claimed."
                    break;
                case 422:
                    span.innerHTML = Object.entries(response.error.data).map(([key,value])=>value).join("<br>");    
                    break;
                default:
                    span.innerHTML = Object.entries(response.error.data).map(([key,value])=>value).join("<br>");
            }
            dump(response);
        }
        else
        {
            state = stateFromRegister(response);
            localStorage.setItem("SpaceTradersData",JSON.stringify(state));
            pushAgent();
            keepAgents();
            API_GET(`systems/${state.ship.nav.systemSymbol}`,(response)=>{
                state.system = response.data;
                state.systems = [response.data];
                state.current.systemIndex = 0;
                keepState();
            });
            start();
            
        }
    });
}
function stateFromRegister(response)
{
    const state = {
        agent:      response.data.agent,
        contracts:  [response.data.contract],
        contract:   response.data.contract,
        factions:   [response.data.faction],
        faction:    response.data.faction,
        fleet:      [response.data.ship],
        ship:       response.data.ship,
        token:      response.data.token,
        current: {
            contractIndex:  0,
            factionIndex:   0,
            shipIndex:      0,
            systemIndex:    0,
            surveyIndex:    0
        }
    };
    return state;
}

function keepAgents()
{
    localStorage.setItem("SpaceTradersAgents",JSON.stringify(agents));
}
function pushAgent()
{
    agents = agents.map(agent=>({...agent,currentAgent:false}));
    agents.push({
        agent:          state.agent,
        token:          state.token,
        creation:       new Date(),
        currentAgent:   true,
        nextReset:      nextReset || (new Date()).toLocaleString()
    });
}
function loadAgents()
{
    if (localStorage.getItem("SpaceTradersAgents")!=null)
        agents = JSON.parse(localStorage.getItem("SpaceTradersAgents"));
    else
        agents = [];
}
function buildAgentCombo()
{
    const newOption = (value,text,def) => {
        var opt = document.createElement("OPTION");
        opt.text = text;
        opt.value = value;
        if (value == def) opt.selected = true;
        return opt;
    };
    loadAgents();
    var def = (agents.filter(e=>e.currentAgent)[0]||{agent:{symbol:""}}).agent.symbol;
    var cbo = document.getElementById("agentlist");
    cbo.options.add(newOption("","-- new agent --"));
    agents.forEach((agent)=>cbo.options.add(newOption(agent.agent.symbol,agent.agent.symbol,def)));
    selectAgent();
}

function selectAgent()
{
    var selectedValue = document.getElementById("agentlist").value;
    document.getElementById("loginform").className = selectedValue != "" ? "oldagent" : "newagent";
    if (selectedValue=="") return;
    state = {token:agents.filter(e=>e.agent.symbol==selectedValue)[0].token};
    var loginButton = document.getElementById("login");
    getStatus(success,failure);
    function success(response)
    {
        loginButton.disabled = false;
        document.getElementById("loginerror").innerHTML = "";
    }
    function failure(response)
    {
        console.log("failure",response.error.message);
        loginButton.disabled = true;
        document.getElementById("loginerror").innerHTML = response.error.message;
    }
}

function doLogin()
{
    const success = (response) => 
    {
        if (response.status.indexOf("online") >= 0)
        {
            start();
            return;
        }
    };
    const failure = (response)=>{
        console.log("STATUS ERROR",response)
    };
    getStatus(success,failure);
}

