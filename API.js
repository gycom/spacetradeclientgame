async function API_GET(query,callback,errorcb)
{
    let json;
    const options = {
        method:"GET",
        headers:{"Accept":"application/json"},
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;
    var response;
    try
    {
        response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
    }
    catch(err) 
    {
        console.log(err);
        if (errorcb) errorcb({error:err.message}); else unmanaged(json);
    }
    var text = await response.text();
    if (text!="")
    {
        try
        {
            json = JSON.parse(text);
            if (query) console.log("JSON GET",query,json.data);
        } catch(err){
            console.log("JSON err",err)
            if (errorcb) errorcb({error:err.message}); else unmanaged(json);
        }
        if (json.error)
        {
            if (errorcb) errorcb(json); else unmanaged(json);
        }
        else
        {    
            callback(json);
        }
    }
    else
    {
        if (errorcb) errorcb({data:{}}); else unmanaged(json);
    }
}

async function API_POST(query,body,callback,errorcb)
{
    let response;
    let json;
    const options = {
        method:"POST",
        headers:{
            "Accept":"application/json",
            "Content-Type":"application/json",

        },
        body:body?JSON.stringify(body):undefined
    };
    if (state && state.token) options.headers.Authorization = `Bearer ${state.token}`;
    try
    {
        response = await fetch(`https://api.spacetraders.io/v2/${query}`,options);
        if (!(response.status>=200 && response.status<=209)) 
            console.log("code "+response.status+"!!",response);
    } catch(err) {
        console.log("ERREUR POST RESPONSE",err,response)
    }
   //console.log("Post Catch")
    json = await response.json();
    if (json.error) unmanaged(json.error.message);
    if (json.error)
        console.log("JSON ERR",query,json.error.message);
    else
        console.log("JSON POST",query,json.data)
    callback(json);
}

function unmanaged(response,ctx)
{
    var div = document.getElementById("unmanagederror");
    div.innerHTML = response;
    div.style.color = "yellow";
}