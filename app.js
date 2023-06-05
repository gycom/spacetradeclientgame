let store = null;
let status = null;
let state = null;
let currentTab = 0;
function bodyLoad()
{
    getStatus((status) => 
    {
        console.log(status.status,status.status.indexOf("online"))
        if (status.status.indexOf("online") >= 0)
        {
            console.log("register")
            start();
            return;
        }
        //alert(status.status);
    });
}

async function API_GET(query,callback)
{
    let json;
    const options = {
        method:"GET",
        headers:{"Accept":"application/json"},
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;

    try
    {
        const response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
        json = await response.json();
    }
    catch(err) 
    {
        dump(err);
    }
    callback(json);
}

async function API_POST(query,body,callback)
{
console.log(body)
    let json;
    const options = {
        method:"POST",
        headers:{
            "Accept":"application/json",
            "Content-Type":"application/json",

        },
        body:JSON.stringify(body)
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;
    console.log("token",options.Security)
    try
    {
        const response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
        json = await response.json();
    } 
    catch(err)
    {
        dump(err);
    }
    callback(json);
}

function getStatus(callback)
{
    API_GET("",(data)=>{
        links(data);
        serverstatus(data);
        leaderboard(data);
        callback(data);
    });
}

function acceptContract(contractId)
{
    console.log("accepting...")
    API_POST(`my/contracts/${contractId}/accept`,{/*contractId:contractId*/},(data)=>{
        console.log("raw data",data);
        if (data.error) 
        {
            if (data.error.code==4501) // already accepted... oups!!
            {
                console.log("refreshing contract list");
                API_GET("my/contracts",(data)=>{
                    dump(data);
                    state.contracts=data.data;
                    state.contract=state.contracts[0];
                    state.current.contractIndex=0;
                });
            }
        }
        else
        {
            console.log("accepted contract",data);
            var index = state.contracts.reduce((t,e,n)=>{
                console.log("search existing", data.data.contract.id,e.id,n);
                if (data.data.contract.id==e.id) 
                    return n;
                else
                    return t;
            },-1);
            if (index>=0) {
                console.log("déjà dans la liste, remplace le " + index + " ieme",state.contracts[index]);
                if (data.data.contract)
                {
                    state.contracts[index] = data.data.contract;
                    state.contract = data.data.contract;
                    state.current.contractIndex = index;
                }
                else
                {
                    console.log(data.data.contract,data.data,data,state)
                }
            }
            else
            {
                console.log("n'existait pas dans la liste");
                state.contracts=[];
                state.contracts.push(data.contract);
                state.contract = data.contract;
                state.current.contractIndex = 0;
            }
        
        }
        keepState();
        refresh();
    });
}

var systems = [];
function systemList(callback)
{
    API_GET("systems?limit=10&page=1",(data)=>{
        systems = data.data;
        callback();
    })
}

function setCooling(shipSymbo0,cooldown)
{
    state.ship.cooldown=cooldown;
}
function startExtraction(shipSymbol,survey) // not ready missing survey
{
    API_POST(`my/ships/${shipSymbol}/extract`,{survey:survey},(data)=>{
        if (data.cooldown)
        {
            setCooling(shipSymbol,data.cooldown);
        }
    });
/*
{
  "data": {
    "cooldown": {
      "shipSymbol": "string",
      "totalSeconds": 0,
      "remainingSeconds": 0,
      "expiration": "2019-08-24T14:15:22Z"
    },
    "extraction": {
      "shipSymbol": "string",
      "yield": {
        "symbol": "string",
        "units": 0
      }
    },
    "cargo": {
      "capacity": 0,
      "units": 0,
      "inventory": [
        {
          "symbol": "string",
          "name": "string",
          "description": "string",
          "units": 1
        }
      ]
    }
  }
}
*/
}

function links(data)
{
    var linkFilter = e => ["Website","Documentation","API Reference","Discord","Twitter"].includes(e.name);
    var links = document.querySelector("#links");
    links.innerHTML = data.links
                        .filter(linkFilter)
                        .map(renderLink)
                        .join("");
    function renderLink(e)
    {
        return `<li><a target="_blank" href='${e.url}'>${e.name}</a></li>`
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
function serverstatus(data)
{
    var div=document.getElementById("serverstatus");
    div.innerHTML = 
    `
        <p>
        ${data.version}: 
        ${data.status}
        </p>
        <p><i>Last Reset: ${d(data.resetDate)}</i></p>
        <p><i>Next Reset: ${dt(data.serverResets.next)}</i></p>
        <p>${data.description}</p>
        <p><i>${JSON.stringify(data.stats)}</i></p>
    `;
}

function leaderboard(data)
{
    var leader = document.getElementById("leaderboard");
    var leader2 = document.getElementById("leaderboard2");
    leader.innerHTML = "MOST CREDIT: <hr>" + data.leaderboards.mostCredits.map(renderLeader).join("");
    leader2.innerHTML = "MOST ACTIVE: <hr>" + data.leaderboards.mostSubmittedCharts.map(renderLeader2).join("");
    function renderLeader(e)
    {
        return `<p>&nbsp;&nbsp;${e.agentSymbol}: ${e.credits}</p>`;
    }
    function renderLeader2(e)
    {
        return `<p>&nbsp;&nbsp;${e.agentSymbol}: ${e.chartCount}</p>`;
    }
}

function start()
{
    store = localStorage.getItem("SpaceTradersData");
    if (store==null)
    {
        document.getElementById("registration").classList.add("notlogged");
        //alert("not logged")
        return;
    }
    else 
    {
        if (!store.token) 
        {
            document.getElementById("registration").classList.add("notlogged");
        }
    }

    document.getElementById("registration").classList.remove("notlogged");
    store = JSON.parse(store);
    if (!store.data)
    { 
        state = store;
    }
    else
    {
        dump(store)
        console.log("creation du state",store,store.contract)
        state = {
            current: {
                contractIndex:0,
                factionIndex:0,
                shipIndex:0,
                systemIndex:0
            },
            agent:store.data.agent,
            contracts:[store.data.contract],
            contract:store.data.contract,
            factions:[store.data.faction],
            faction:store.data.faction,
            fleet:[store.data.ship],
            ship:store.data.ship,
            systems:[],
            token:store.data.token
        }
        console.log("state créé", state);
        keepState();
    }
    refresh();
}
function keepState()
{
    localStorage.setItem("SpaceTradersData",JSON.stringify(state));
}
function refresh()
{
    showTab();
    showTabContent(state);
}
function showTab()
{
    var div = document.querySelector(".tab-header");
    div.innerHTML = `
    <div class="active tab icon icon-home">Agent</div>
    <div class="tab icon icon-contract">Contracts</div>
    <div class="tab icon icon-faction">Factions</div>
    <div class="tab icon icon-ship">Fleet</div>
    <div class="tab icon icon-galaxy">Systems</div>
`;
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
                        <h2 class="listheader">Agent</h2>
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
        <div class="content text-white icon icon-contract ${currentTab==1?'active':''}">
            ${panListDetail("Contrats",contractList(data.contracts),contractInfo(data.contract))}
        </div>
        <div class="content text-white icon icon-faction ${currentTab==2?'active':''}">
            ${panListDetail("Factions",factionList(data.factions),factionInfo(data.faction))}
        </div>
        <div class="content text-white icon icon-ship ${currentTab==3?'active':''}">
            ${panListDetail("Fleet",shipList(data.fleet),shipInfo(data.ship))}
        </div>
        <div class="content text-white icon icon-galaxy ${currentTab==3?'active':''}">
            ${systemInfo(data.system)}
        </div>
        `;
    initSect();
}

function systemInfo(system)
{
    return `
    <h2>System</h2>
    `;
}

function panListDetail(title,listgen,detailgen)
{
    return `
    <div class="flex-row" style="height:95%;width:95%;">
        <div><h1 class="listheader">${title}</h1></div>
        <div class="flex-col" style="flex:auto;">
            <div class="listscroll">
                ${listgen}
            </div>
            <div class="listdetail">
                ${detailgen}
            </div>
        </div>
    </div>
`;
}
function agentInfo(agent)
{
    return `
    <div class="icon icon-user">${agent.symbol}</div>
    <div class="icon icon-hq">${agent.headquarters}</div>
    <div class="icon icon-coin">${agent.credits}</div>
`;
}
function contractList(list)
{
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-contract="${item.id}">${item.type} ${item.factionSymbol} ${item.terms.payment.onFulfilled} credits</div>`;
    }
}
function contractInfo(contract)
{
    return `
    <div>Type: ${contract.type}</div>
    <div>Faction: ${contract.factionSymbol}</div>
    <br>
    ${contractTerm(contract.terms)}
    <br>
    <div>Deliver:</div>
    <div class="delivery-list">${goodList(contract.terms.deliver)}</div>
    <br>
    <div><input type="checkbox" ${contract.accepted?"checked":""} disabled> Accepted</div>
    <div><input type="checkbox" ${contract.fulfilled?"checked":""} disabled> Fulfilled</div>
    <br>
    <div>Expired on ${dt(contract.expiration)}</div>
    <div>Must accept before ${dt(contract.deadlineToAccept)}</div>
    <div>${contract.accepted?"":makeButton(contract.id)}</div>
`;
    function makeButton(id)
    {
        return `<button onclick="acceptContract('${id}')">Accept Contract</button>`
    }
    function contractTerm(terms)
    {
        return `
        <div>Deadline: ${dt(terms.deadline)}</div>
        <div>Payment on accepted: ${terms.payment.onAccepted} credits</div>
        <div>Payment on fulfilled: ${terms.payment.onFulfilled} credits</div>
    `;
    }
    function goodList(goods)
    {
        return  goods.map(goodItem).join("<br>");
        function goodItem(e)
        {
            return `
            ${e.tradeSymbol}: ${e.unitsFulfilled} / ${e.unitsRequired} units for ${e.destinationSymbol}
            `;
        }
    }
}
function factionList(list)
{
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-faction="${item.symbol}">${item.name} ${item.symbol}</div>`;
    }
}
function factionInfo(faction)
{
    return `
        <div>${faction.symbol} - ${faction.name}</div>
        <div><blockquote>${faction.description}</blockquote></div>
        <div>Headquarters: ${faction.headquarters}</div>
        <div>Trait:</div>
        <div class="traitlist">${traitList()}</div>
        <div><input type="checkbox" ${faction.isRecruiting?"checked":""} readonly=readonly> is recruiting?</div>
`;
    function traitList()
    {
        return faction.traits.map(traitDetail).join(",&nbsp;");
        function traitDetail(e)
        {
            return `<span title="${e.description}">${e.name}</span>`;
        }
    }
}
function shipList(list)
{
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-ship="${item.registration.name}">${item.registration.name} ${item.registration.role}</div>`;
    }
}
function shipInfo(ship)
{
    //  ${}
    return `
    <div>Registration: ${ship.symbol} Type: ${ship.registration.role}</div>
    <br>
    <div class="panel-section">
        <div class="section-header">
            <div class="sect">Navigation</div>
            <div class="sect active">Crew</div>
            <div class="sect">Fuel</div>
            <div class="sect">Frame</div>
            <div class="sect">Reactor</div>
            <div class="sect">Engine</div>
            <div class="sect">Modules</div>
            <div class="sect">Mount</div>
            <div class="sect">Cargo</div>
        </div>
        <div class="section-content">
            ${shipTabs(ship)}
        </div>
    </div>
`;
    function shipTabs(ship)
    {
        return `
        <div class="section">
            ${navSpec(ship.nav)}
        </div>
        <div class="section active">
            <div>Crew: ${ship.crew.current} / ${ship.crew.capacity} (min req'd ${ship.crew.required}) </div>
            <div>Morale: ${ship.crew.morale} </div>
            <div>Wages: ${ship.crew.wages} </div>
            <div>Rotation: ${ship.crew.rotation} </div>
        </div>
        <div class="section">
            <div>Fuel: ${ship.fuel.current} / ${ship.fuel.capacity}</div>
        </div>
        <div class="section">
            ${shipFrame(ship.frame)}
        </div>
        <div class="section">
            ${shipReactor(ship.reactor)}
        </div>
        <div class="section">
            ${shipEngine(ship.engine)}
        </div>
        <div class="section">
            <div>${moduleList(ship.modules)}</div>
        </div>
        <div class="section">
            <div>${mountList(ship.mounts)}</div>
        </div>
        <div class="section">
            ${shipCargo(ship.cargo)}
        </div>
`;
    }
    function navSpec(nav)
    {
        return `
        <div>System: ${nav.systemSymbol} Location: ${nav.waypointSymbol}</div>
        <div>Status: ${nav.status}<br>Mode: ${nav.flightMode}</div>
        <div>Route:</div>
        <div>
            Departure: ${wayPoint(nav.route.departure)} (${dt(nav.route.arrival)})<br>
            Destination: ${wayPoint(nav.route.destination)} 
            (${dt(nav.route.departureTime)})
        </div>
`;
    }
    function wayPoint(w)
    {
        return `${w.type} ${w.symbol} (${w.x})-(${w.y})`;
    }
    function moduleList(mod)
    {
        return mod.map(moduleItem).join("<br>");
        function moduleItem(e)
        {
            return `${e.name}: Require: Crew: ${e.requirements.crew} Power: ${e.requirements.power} Slots: ${e.requirements.slots}`;
        }
    }
    function shipFrame(frame)
    {
        return `
        <div>${frame.name}</div>
        <div>${frame.description}</div>
        <div>Slots: ${frame.moduleSlots}</div>
        <div>Condition:${frame.condition} %</div>
        <div>Required: Power ${frame.requirements.power} Crew: ${frame.requirements.crew}</div>
`;
    }
    function shipReactor(reactor)
    {
        return `
        <div>${reactor.name}</div>
        <div>${reactor.description}</div>
        <div>Condition: ${reactor.condition} %</div>
        <div>Power output: ${reactor.powerOutput}</div>
        <div>Required: Crew: ${reactor.requirements.crew}</div>
`;
    }
    function shipEngine(engine)
    {
        return `
        <div>${engine.name}</div>
        <div>${engine.description}</div>
        <div>Condition:${engine.condition} %</div>
        <div>
        Required: Power ${engine.requirements.power} 
        Crew: ${engine.requirements.crew}
        </div>
`;
    }
    function mountList(mnt)
    {
        return "<div>" + mnt.map(mountItem).join("</div><hr><div>") + "</div>";
        function mountItem(e)
        {
            return `
            <p>${e.name}:<br> 
                Require: Crew ${e.requirements.crew} Power: ${e.requirements.power}<br>
                Strength: ${e.strength}<br>
                ${e.description}<br>
            </p>
            ${e.deposits?depositList(e.deposits):""}
            `;
        }
    }
    function depositList(m)
    {
        return m.map(depositItem).join("");
        function depositItem(item)
        {
            return `<div>${item}</div>`;
        }
    }
    function shipCargo(cargo)
    {
        return `
        <div>Capacity:${cargo.capacity}</div>
        <div>Units:${cargo.units}</div>
        <div>Inventory:${inventoryList(cargo.inventory)}</div>
`;
    }
    function inventoryList(inv)
    {
        return inv.map(invDetail).join("");
        function invDetail(d)
        {
            return JSON.stringify(d); // for now
        }
    }
}
function dump(data) // for debugging
{
    let pre = document.getElementById("tempdata");
    if (pre){
        if (typeof(data)=="string")
            pre.innerHTML = data;
        else
        {
            if (typeof(data)=="object")
            {
                pre.innerHTML = JSON.stringify(data,null,2);
            }
        }
    }
}

function register()
{
    const body = {
        "faction":document.getElementById("faction").value,
        "symbol":document.getElementById("symbol").value,
        "email":document.getElementById("email").value
    };
    API_POST("register", body, data =>
    {
        console.log(data)
        if (data.error)
        {
            dump(data);
        }
        else
        {
            store = data;
            localStorage.setItem("SpaceTradersData",JSON.stringify(store));
            start();
        }
    });
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
            console.log(currentTab);
            _class("tab-header")[0].querySelectorAll(".tab.active")[0].classList.remove("active");
            tabPanes[i].classList.add("active");
            _class("tab-indicator")[0].style.top = `${i*48}px`;
            _class("tab-content")[0].querySelectorAll(".content.active")[0].classList.remove("active");
            let current = _class("tab-content")[0].querySelectorAll("div.content")
            current[i].classList.add("active");
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
            currentTab = i;
            console.log(currentTab);
            _class("section-header")[0].querySelectorAll(".sect.active")[0].classList.remove("active");
            tabPanes[i].classList.add("active");
            _class("section-content")[0].querySelectorAll(".section.active")[0].classList.remove("active");
            let current = _class("section-content")[0].querySelectorAll("div.section")
            current[i].classList.add("active");
        });
    };
}
