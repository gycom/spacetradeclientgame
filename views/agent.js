function agentInfo(agent)
{
    return `
    <div class="icon icon-user">${agent.symbol}</div>
    <div class="icon icon-hq">${agent.headquarters}</div>
    <div class="icon icon-coin">${agent.credits}</div>
    <button onclick="logout()">Logout</button>
`;
}
function refreshAgent()
{
    API_GET("my/agent",(data)=>{
        currentTab = 0;
        state.agent = data.data;
        showTabContent(state);
    })
}
