function shipList(list)
{
    if (!list) return "";
    return list.map(listItem).join("");
    function listItem(item)
    {
        return `<div data-ship="${item.registration.name}">${item.registration.name} ${item.registration.role}</div>`;
    }
}
function shipInfo(ship)
{
    //  ${}
    if (!ship) return "";
    return `
    <div onclick="setCooling('${ship.symbol}',100)">Registration: ${ship.symbol} Type: ${ship.registration.role}
    
    </div>
    <br>
    <div class="panel-section">
        <div class="section-header">
            <div class="sect ${currentSection==0?"active":""}">Navigation</div>
            <div class="sect ${currentSection==1?"active":""}">Crew</div>
            <div class="sect ${currentSection==2?"active":""}">Fuel</div>
            <div class="sect ${currentSection==3?"active":""}">Frame</div>
            <div class="sect ${currentSection==4?"active":""}">Reactor</div>
            <div class="sect ${currentSection==5?"active":""}">Engine</div>
            <div class="sect ${currentSection==6?"active":""}">Modules</div>
            <div class="sect ${currentSection==7?"active":""}">Mount</div>
            <div class="sect ${currentSection==8?"active":""}">Cargo</div>
        </div>
        <div class="section-content">
            ${shipTabs(ship)}
        </div>
    </div>
`;
    function shipTabs(ship)
    {
        return `
        <div class="section ${currentSection==0?"active":""}">
            ${navSpec(ship.nav)}
        </div>
        <div class="section ${currentSection==1?"active":""}">
            <div>Crew: ${ship.crew.current} / ${ship.crew.capacity} (min req'd ${ship.crew.required}) </div>
            <div>Morale: ${ship.crew.morale} </div>
            <div>Wages: ${ship.crew.wages} </div>
            <div>Rotation: ${ship.crew.rotation} </div>
        </div>
        <div class="fuel section ${currentSection==2?"active":""}">
            <div>Fuel: ${ship.fuel.current} / ${ship.fuel.capacity}</div>
        </div>
        <div class="section ${currentSection==3?"active":""}">
            ${shipFrame(ship.frame)}
        </div>
        <div class="section ${currentSection==4?"active":""}">
            ${shipReactor(ship.reactor)}
        </div>
        <div class="section ${currentSection==5?"active":""}">
            ${shipEngine(ship.engine)}
        </div>
        <div class="section ${currentSection==6?"active":""}">
            <div>${moduleList(ship.modules)}</div>
        </div>
        <div class="section ${currentSection==7?"active":""}">
            <div>${mountList(ship.mounts)}</div>
        </div>
        <div class="section ${currentSection==8?"active":""}">
            ${shipCargo(ship.cargo)}
        </div>
    `;
    function navSpec(nav)
    {
        return `
        <div>System: ${nav.systemSymbol} Location: ${nav.waypointSymbol} ${makeButtonSurveyExtraction()}</div>
        <div>Status: ${nav.status}${actionDockOrbit(nav)}</div>
        <div>Mode: ${nav.flightMode}</div>
        <div>Route: ${routeInfo(nav.route)}</div>
    `;
        function makeButtonSurveyExtraction()
        {
            var buttonList = "";
            if (state.surveys && state.surveys.filter(e=>e.symbol == nav.waypointSymbol).length > 0)
            {
                buttonList += `<button onclick="extractResource('${state.ship.symbol}','${escape(JSON.stringify(state.surveys.filter(e=>e.symbol == nav.waypointSymbol)[0]))}')">Extraction</button>`;
            }
            else
            {
                if (nav.status=="IN_ORBIT")
                    buttonList += `<button onclick="createSurvey('${state.ship.symbol}')">Scan here</button>`;
            }
            return buttonList;

        }
        function routeInfo(route)
        {
            if (route)
            {
                return `
                <div>
                    Departure: ${wayPoint(route.departure)} (${dt(route.departureTime)})<br>
                    Destination: ${wayPoint(route.destination)} 
                    (${dt(route.arrival)})
                </div>
    `;
            }
            else
            return "";
        }
    }

    function refreshNav(nav)
    {
        var sect = document.querySelector(".nav");
        sect.innerHTML = navSpec(nav);
    }

    function actionDockOrbit(nav)
    {
        switch(nav.status)
        {
            case "DOCKED":
                return `<button onclick="goOrbit('${ship.registration.name}')">Go Orbit</button>`;
            case "IN_ORBIT":
                return `<button onclick="goDock('${ship.registration.name}')">Dock</button>`;
            case "IN_TRANSIT":
                return "";
        }
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
        <div>` 
            + (lastSurvey?`<button onclick="extractResource('${ship.symbol}',lastSurvey)">Extract again</button>`:"")
            + `<button onclick="cancelRestart('${ship.symbol}')">Stop after cooling</button>
        </div>
        <div>Inventory:${inventoryList(cargo.inventory)}</div>
        <div><button onclick="dropIrrelevantCargo('${ship.symbol}')">Drop Waste</button></div>
    `;
    }
    function inventoryList(inv)
    {
        return "<table style='width:100%'>" + inv.map(invDetail).join("") + "</table>";
        function invDetail(d)
        {
            return `
            <tr>
                <td>${d.units}</td>
                <td title="${d.description}">${d.symbol}</td>
                <td>${d.name}</td>
                <td><button onclick="dropCargo('${ship.symbol}',${d.units},'${d.symbol}')">Drop</button></td>
            </tr>
            `; // for now
        }
    }
    }

}

function selectShip()
{
    var ev = window.event;
    var target = ev.target;
    var selection = target.getAttribute("data-ship");
    if (selection!=null)
    {
        var ndx = findShipIndex(selection);
        if (ndx>=0)
        {
            state.current.shipIndex = ndx;
            state.ship = state.fleet[state.current.shipIndex];
            refreshFleetList();
        }
    }
}
function findShipIndex(sel)
{
    return (state.fleet.map((e,n)=>({n:n,e:e})).filter(e=>e.e.symbol==sel)||[{n:-1}])[0].n;
}
function refreshFleetList(callback)
{
    API_GET("my/ships",(response)=>{
        state.fleet = response.data;
        if (state.fleet.length>0)
        {
            API_GET(`my/ships/${state.fleet[state.current.shipIndex].symbol}`,(response)=>{
                state.ship = response.data;
                keepState();
            });
        }
        keepState();
        redrawTabs();
        if (callback) callback();
    })
}
function refreshFuel(fuel)
{
    var sect = document.querySelector(".fuel");
    sect.innerHTML = `<div>Fuel: ${fuel.current} / ${fuel.capacity}</div>`;
}
