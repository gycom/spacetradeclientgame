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
