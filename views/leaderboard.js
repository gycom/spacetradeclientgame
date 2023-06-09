function leaderboard(data)
{
    var leader = document.getElementById("leaderboard");
    var leader2 = document.getElementById("leaderboard2");
    leader.innerHTML = "MOST CREDIT: <hr>" + data.leaderboards.mostCredits.filter((_,n)=>n<5).map(renderLeader).join("");
    leader2.innerHTML = "MOST ACTIVE: <hr>" + data.leaderboards.mostSubmittedCharts.filter((_,n)=>n<5).map(renderLeader2).join("");
    function renderLeader(e)
    {
        return `<p>&nbsp;&nbsp;${e.agentSymbol}: ${e.credits}</p>`;
    }
    function renderLeader2(e)
    {
        return `<p>&nbsp;&nbsp;${e.agentSymbol}: ${e.chartCount}</p>`;
    }
}
