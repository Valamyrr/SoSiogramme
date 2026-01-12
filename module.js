document.getElementById("export").addEventListener("click",()=>{
	var element = document.createElement('a');
	element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(personnages, null,4)));
	element.setAttribute('download', "sosiogramme.json");
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
});

document.getElementById("import").addEventListener("click",()=>{
	document.getElementById("importInput").click();
});
document.getElementById("importInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
	try {
        const jsonContent = JSON.parse(e.target.result);
	    console.log("Contenu importé :",jsonContent)	
        jsonContent.forEach(pi => {
		    personnages.forEach(p => {
				if(pi.nom == p.nom){
					p.x = pi.x
					p.y = pi.y
				}
			});
	    });
		draw(false,true)
    } catch (error) {
      console.error("JSON invalide:",error);
    }
  };

  reader.readAsText(file);
});
