function start()
{
    let input = document.getElementById('code');
    input.addEventListener("keypress", 
        function (event)
        {
            if (event.code === "Enter")
            {
                react();
            }
        }
    );  
}

function react()
{
    let input = document.getElementById('code');
    console.log(input.value);
}