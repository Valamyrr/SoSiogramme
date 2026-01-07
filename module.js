const svg = document.getElementById("graphe");
const grapheContainer = document.getElementById("graphe-container");
const NS = "http://www.w3.org/2000/svg";

let width = grapheContainer.clientWidth*2;
let height = grapheContainer.clientHeight*2;

const groupes = {
  Kumo: "#ccaf4a",
  Homura: "#689465",
  Kiri: "#6685a0",
  Errants: "#85231a"
};

const relationsColors = {
  affection: "#FF8DE3",
  amitié: "#FFD100",
  compliqué: "#FF854E",
  famille: "#5BCC5D",
  maître: "#66FFF2",
  élève: "#66FFF2",
  hostilité: "#A91B1B",
  respect: "#8FFF5A",
  rivalité: "#FF6F3C",
  peur: "#BDF948",
  jalousie: "#FFB4DF"
};

const relationsLabels = {
  affection: "Affection",
  amitié: "Amitié",
  compliqué: "Compliqué",
  famille: "Famille",
  maître: "Maître",
  élève: "Elève",
  hostilité: "Hostilité",
  respect: "Respect",
  rivalité: "Rivalité",
  peur: "Peur",
  jalousie: "Jalousie"
};

function getRelationLabel(type) {
  return relationsLabels[type] || type;
}

function csvToJson(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines.shift().split(";");
  return lines.map((line, index) => {
    const values = line.split(";");
    const obj = { id: index + 1 };
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

let nomsPersos = [];
let relations = [];
let xhr = new XMLHttpRequest();
xhr.open('GET', 'https://valamyrr.github.io/SoSiogramme/personnages.csv', false);
xhr.send(null);
if (xhr.status === 200) {
  const csvText = xhr.responseText;
  nomsPersos = csvToJson(csvText)
}else{
  console.error("cannot fetch characters data")
}

xhr = new XMLHttpRequest();
xhr.open('GET', 'https://valamyrr.github.io/SoSiogramme/relations.csv', false);
xhr.send(null);
if (xhr.status === 200) {
  const csvText = xhr.responseText;
  relations = csvToJson(csvText)
}else{
  console.error("cannot fetch relations data")
}

const personnages = nomsPersos.map(p => ({
  ...p,
  x: Math.random() * width,
  y: Math.random() * height
}));

let selectedPersonnages = new Set();
let zoom = 1;
let draggingNode = null;
let panX = -width/4;
let panY = -height/4;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

function createArrowMarkers() {
  const defs = document.getElementById("arrowDefs");
  defs.innerHTML = "";
  
  Object.entries(relationsColors).forEach(([type, color]) => {
    const marker = document.createElementNS(NS, "marker");
    marker.setAttribute("id", `arrow-${type}`);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");
    
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M0,0 L0,6 L9,3 z");
    path.setAttribute("fill", color);
    marker.appendChild(path);
    defs.appendChild(marker);

    const markerReverse = document.createElementNS(NS, "marker");
    markerReverse.setAttribute("id", `arrow-reverse-${type}`);
    markerReverse.setAttribute("markerWidth", "10");
    markerReverse.setAttribute("markerHeight", "10");
    markerReverse.setAttribute("refX", "1");
    markerReverse.setAttribute("refY", "3");
    markerReverse.setAttribute("orient", "auto");
    markerReverse.setAttribute("markerUnits", "strokeWidth");
    
    const pathReverse = document.createElementNS(NS, "path");
    pathReverse.setAttribute("d", "M9,0 L9,6 L0,3 z");
    pathReverse.setAttribute("fill", color);
    markerReverse.appendChild(pathReverse);
    defs.appendChild(markerReverse);
  });
}

function applyLinkForces(isDragging = false) {
  // Si on drag un node mais qu'il n'est PAS sélectionné, pas de force de lien
  if (isDragging && draggingNode && !selectedPersonnages.has(draggingNode.nom)) {
    return;
  }
  
  const strength = isDragging ? 0.15 : 0.01;
  relations.forEach(({ type, source, cible }) => {
	if (type != document.querySelectorAll('.sidebar #toggle-rhrp:checked').length>0?"hrp":"rp") return;
    const a = personnages.find(p => p.nom === source);
    const b = personnages.find(p => p.nom === cible);
    if (!a || !b) return;
    
    // Si on est en train de drag, appliquer la force seulement si un des deux est le node draggé
    if (isDragging && draggingNode && (a !== draggingNode && b !== draggingNode)) {
      return;
    }
    
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const desiredDist = 200;
    const force = strength * (dist - desiredDist);
    const fx = force * (dx / dist);
    const fy = force * (dy / dist);
    
    // Si on drag un node, seul l'autre node bouge
    if (isDragging && draggingNode) {
      if (a === draggingNode) {
        b.x -= fx * 2;
        b.y -= fy * 2;
      } else if (b === draggingNode) {
        a.x += fx * 2;
        a.y += fy * 2;
      }
    } else {
      a.x += fx;
      a.y += fy;
      b.x -= fx;
      b.y -= fy;
    }
  });
}

function applyCollisions(skipDragging = false) {
  const nodeRadius = 70;
  for (let i = 0; i < personnages.length; i++) {
    for (let j = i + 1; j < personnages.length; j++) {
      const a = personnages[i];
      const b = personnages[j];
      
      // Skip collision UNIQUEMENT si on drag ET qu'aucun des deux n'est sélectionné
      if (skipDragging && draggingNode && (a === draggingNode || b === draggingNode)) {
        // Si le nœud draggé EST sélectionné, on applique quand même les collisions
        if (!selectedPersonnages.has(draggingNode.nom)) {
          continue;
        }
      }
      
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = nodeRadius * 2;
      
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const moveX = (dx / dist) * overlap * 0.5;
        const moveY = (dy / dist) * overlap * 0.5;
        
        // Si a est sélectionné mais pas b, seul b bouge
        if (selectedPersonnages.has(a.nom) && !selectedPersonnages.has(b.nom)) {
          b.x += moveX * 2;
          b.y += moveY * 2;
        }
        // Si b est sélectionné mais pas a, seul a bouge
        else if (selectedPersonnages.has(b.nom) && !selectedPersonnages.has(a.nom)) {
          a.x -= moveX * 2;
          a.y -= moveY * 2;
        }
        // Sinon comportement normal (les deux bougent)
        else {
          a.x -= moveX;
          a.y -= moveY;
          b.x += moveX;
          b.y += moveY;
        }
      }
    }
  }
  
  personnages.forEach(p => {
    const margin = 80;
    p.x = Math.max(margin, Math.min(width - margin, p.x));
    p.y = Math.max(margin, Math.min(height - margin, p.y));
  });
}

function draw(isDragging = false, skipForces = false) {
  if (!skipForces) {
    applyLinkForces(isDragging);
    applyCollisions(isDragging);
  }
  svg.innerHTML = '<defs id="arrowDefs"></defs>';
  
  // Créer un groupe pour appliquer le zoom et le pan
  const mainGroup = document.createElementNS(NS, "g");
  mainGroup.setAttribute("transform", `translate(${panX}, ${panY}) scale(${zoom})`);
  
  createArrowMarkers();

  const show = Array.from(document.querySelectorAll('.sidebar input[data-type]:checked')).map(c => c.dataset.type);
  const activeGroups = Array.from(document.querySelectorAll('.sidebar input[data-group]:checked')).map(c => c.dataset.group);
  const showNPCs = document.querySelectorAll('.sidebar #toggle-pnjs:checked').length>0
  const typeRelation = document.querySelectorAll('.sidebar #toggle-rhrp:checked').length>0?"hrp":"rp"
  const showPlayers = document.querySelectorAll('.sidebar #toggle-pjs:checked').length>0
  const search = document.getElementById("searchName").value.toLowerCase();

  let filteredIds = new Set();
  let matches = new Set();
  if (search) {
    matches = personnages.filter(p => p.nom.toLowerCase().includes(search));
    if (matches) {
	  matches.forEach(match =>{
	      filteredIds.add(match.nom);
	      relations.forEach(r => {
			if (r.type != typeRelation) return
	        if (r.source === match.nom) filteredIds.add(r.cible);
	        if (r.cible === match.nom) filteredIds.add(r.source);
	      });
	  });
    }
  }

  // Dessiner les relations UNIQUEMENT si des personnages sont sélectionnés
  if (selectedPersonnages.size > 0) {
    relations.forEach(rel => {
	  if (rel.type != typeRelation) return
      const isRelated = selectedPersonnages.has(rel.source) || selectedPersonnages.has(rel.cible);
      if (!isRelated) return;

      const a = personnages.find(p => p.nom === rel.source);
      const b = personnages.find(p => p.nom === rel.cible);
      if (!a || !b) return;
      if (!activeGroups.includes(a.groupe) || !activeGroups.includes(b.groupe)) return;
      if (search && (!filteredIds.has(rel.source) || !filteredIds.has(rel.cible))) return;
	  if (a.type == "PNJ" || b.type == "PNJ"){
		  if(!showNPCs) return;
	  }
	  if (a.type == "PJ" || b.type == "PJ"){
		  if(!showPlayers) return;
	  }

      const showAtoB = show.includes(rel.typeAversB);
      const showBtoA = show.includes(rel.typeBversA);
      
      if (!showAtoB && !showBtoA) return;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const nodeRadius = 35;
      const shortenDist = nodeRadius + 5;
      const ratio = shortenDist / dist;

      const isSameType = rel.typeAversB === rel.typeBversA;
      const bothVisible = showAtoB && showBtoA;
      
      if (isSameType && bothVisible) {
        const x1 = a.x + (dx * ratio);
        const y1 = a.y + (dy * ratio);
        const x2 = b.x - (dx * ratio);
        const y2 = b.y - (dy * ratio);

        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", relationsColors[rel.typeAversB]);
        line.setAttribute("marker-end", `url(#arrow-${rel.typeAversB})`);
        line.setAttribute("marker-start", `url(#arrow-reverse-${rel.typeAversB})`);
        line.classList.add("link");
        mainGroup.appendChild(line);
        
        // Ajouter le texte au milieu du lien
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        let lineAngle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        // Garder le texte lisible (éviter qu'il soit à l'envers)
        if (lineAngle > 90 || lineAngle < -90) {
          lineAngle += 180;
        }
        
        const textLabel = document.createElementNS(NS, "text");
        textLabel.setAttribute("x", midX);
        textLabel.setAttribute("y", midY - 10);
        textLabel.setAttribute("fill", relationsColors[rel.typeAversB]);
        textLabel.setAttribute("font-size", "11");
        textLabel.setAttribute("font-family", "Merriweather");
        textLabel.setAttribute("text-anchor", "middle");
        textLabel.setAttribute("pointer-events", "none");
        textLabel.setAttribute("transform", `rotate(${lineAngle}, ${midX}, ${midY})`);
        textLabel.textContent = getRelationLabel(rel.typeAversB);
        mainGroup.appendChild(textLabel);
      } else {
        const offsetDist = 5;
        const perpX = -Math.sin(angle) * offsetDist;
        const perpY = Math.cos(angle) * offsetDist;

        if (showAtoB) {
          const x1 = a.x + perpX + (dx * ratio);
          const y1 = a.y + perpY + (dy * ratio);
          const x2 = b.x + perpX - (dx * ratio);
          const y2 = b.y + perpY - (dy * ratio);

          const line1 = document.createElementNS(NS, "line");
          line1.setAttribute("x1", x1);
          line1.setAttribute("y1", y1);
          line1.setAttribute("x2", x2);
          line1.setAttribute("y2", y2);
          line1.setAttribute("stroke", relationsColors[rel.typeAversB]);
          line1.setAttribute("marker-end", `url(#arrow-${rel.typeAversB})`);
          line1.classList.add("link");
          mainGroup.appendChild(line1);
          
          // Ajouter le texte pour A vers B (à l'extérieur)
          // Ajouter le texte pour A vers B (à l'extérieur)
          const midX1 = (x1 + x2) / 2;
          const midY1 = (y1 + y2) / 2;
          let lineAngle1 = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          
          // Garder le texte lisible (éviter qu'il soit à l'envers)
          if (lineAngle1 > 90 || lineAngle1 < -90) {
            lineAngle1 += 180;
          }
          
          // Déterminer si cette ligne est au-dessus (perpY négatif = au-dessus)
          const isAbove = perpY < 0;
          const textDistance = isAbove ? 8 : 12;
          const textOffsetX = perpX * (1 + textDistance / offsetDist);
          const textOffsetY = perpY * (1 + textDistance / offsetDist);
          
          const textLabel1 = document.createElementNS(NS, "text");
          textLabel1.setAttribute("x", midX1 + textOffsetX);
          textLabel1.setAttribute("y", midY1 + textOffsetY);
          textLabel1.setAttribute("fill", relationsColors[rel.typeAversB]);
          textLabel1.setAttribute("font-size", "11");
          textLabel1.setAttribute("font-family", "Merriweather");
          textLabel1.setAttribute("text-anchor", "middle");
          textLabel1.setAttribute("pointer-events", "none");
          textLabel1.setAttribute("transform", `rotate(${lineAngle1}, ${midX1 + textOffsetX}, ${midY1 + textOffsetY})`);
	  textLabel1.textContent = getRelationLabel(rel.typeAversB);
          mainGroup.appendChild(textLabel1);
        }

        if (showBtoA) {
          const x1 = b.x - perpX + (-dx * ratio);
          const y1 = b.y - perpY + (-dy * ratio);
          const x2 = a.x - perpX - (-dx * ratio);
          const y2 = a.y - perpY - (-dy * ratio);

          const line2 = document.createElementNS(NS, "line");
          line2.setAttribute("x1", x1);
          line2.setAttribute("y1", y1);
          line2.setAttribute("x2", x2);
          line2.setAttribute("y2", y2);
          line2.setAttribute("stroke", relationsColors[rel.typeBversA]);
          line2.setAttribute("marker-end", `url(#arrow-${rel.typeBversA})`);
          line2.classList.add("link");
          mainGroup.appendChild(line2);
          
          // Ajouter le texte pour B vers A (à l'extérieur)
          const midX2 = (x1 + x2) / 2;
          const midY2 = (y1 + y2) / 2;
          let lineAngle2 = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          
          // Garder le texte lisible (éviter qu'il soit à l'envers)
          if (lineAngle2 > 90 || lineAngle2 < -90) {
            lineAngle2 += 180;
          }
          
          // Déterminer si cette ligne est au-dessus (perpY positif = au-dessus pour B vers A)
          const isAbove = perpY > 0;
          const textDistance = isAbove ? 8 : 12;
          const textOffsetX = -perpX * (1 + textDistance / offsetDist);
          const textOffsetY = -perpY * (1 + textDistance / offsetDist);
          
          const textLabel2 = document.createElementNS(NS, "text");
          textLabel2.setAttribute("x", midX2 + textOffsetX);
          textLabel2.setAttribute("y", midY2 + textOffsetY);
          textLabel2.setAttribute("fill", relationsColors[rel.typeBversA]);
          textLabel2.setAttribute("font-size", "11");
          textLabel2.setAttribute("font-family", "Merriweather");
          textLabel2.setAttribute("text-anchor", "middle");
          textLabel2.setAttribute("pointer-events", "none");
          textLabel2.setAttribute("transform", `rotate(${lineAngle2}, ${midX2 + textOffsetX}, ${midY2 + textOffsetY})`);
          textLabel2.textContent = getRelationLabel(rel.typeBversA);
          mainGroup.appendChild(textLabel2);
        }
      }
    });
  }

  // Dessiner les personnages
  personnages.forEach(p => {
    if (!activeGroups.includes(p.groupe)) return;
    if (search && !filteredIds.has(p.nom)) return;
	if (p.type == "PNJ" && !showNPCs) return;
	if (p.type == "PJ" && !showPlayers) return;
	  
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", selectedPersonnages.has(p.nom) ? "node selected" : "node");
    g.setAttribute("transform", `translate(${p.x},${p.y})`);

    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("r", 35);
    circle.setAttribute("fill", "#fff");
    circle.setAttribute("stroke", groupes[p.groupe] || "#666");
    circle.setAttribute("stroke-width", selectedPersonnages.has(p.nom) ? 10 : 8);
    g.appendChild(circle);

    const img = document.createElementNS(NS, "image");
    img.setAttribute("href", p.icone || p.image);
    img.setAttribute("x", -35);
    img.setAttribute("y", -35);
    img.setAttribute("width", 70);
    img.setAttribute("height", 70);
    img.setAttribute("class", "node-image");
	img.setAttribute("preserveAspectRatio","xMidYMin slice");
    g.appendChild(img);

    // Mesurer le texte pour créer le background
    const textContent = p.nom;
    const fontSize = 14;
    const estimatedWidth = textContent.length * (fontSize * 0.6) + 12; // Estimation de la largeur + padding
    const textHeight = fontSize + 15; // Hauteur + padding (augmenté de 6 à 10)
    const textY = 55; // Position Y du texte (décalée vers le bas)
    
    // PERSONNALISATION DU BLOC NOM :
    const namePadding = 6; // Padding horizontal (3px de chaque côté)
    const nameVerticalPadding = 0; // Padding vertical (augmenté de 3 à 5)
    const borderRadius = 5; // Arrondi des coins
    const nameOffsetY = 10; // Décalage vers le bas depuis l'icône
    
    // Créer le rectangle de fond
    const bgRect = document.createElementNS(NS, "rect");
    bgRect.setAttribute("x", -estimatedWidth / 2);
    bgRect.setAttribute("y", 35 + nameOffsetY - nameVerticalPadding);
    bgRect.setAttribute("width", estimatedWidth);
    bgRect.setAttribute("height", textHeight);
    bgRect.setAttribute("rx", borderRadius);
    bgRect.setAttribute("ry", borderRadius);
    bgRect.setAttribute("class", "node-name-bg");
	if(p.type=="PNJ"){
		 bgRect.setAttribute("class","node-name-bg pnj");
	}
    g.appendChild(bgRect);

    const text = document.createElementNS(NS, "text");
    text.setAttribute("y", textY + nameOffsetY);
    text.textContent = p.nom;
    g.appendChild(text);

    let isDragging = false, hasMoved = false, offsetX = 0, offsetY = 0;
    
    g.addEventListener("mousedown", e => {
      e.stopPropagation();
      e.preventDefault();
      isDragging = true;
      hasMoved = false;
      draggingNode = p;
      
      const rect = svg.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - panX) / zoom;
      const mouseY = (e.clientY - rect.top - panY) / zoom;
      
      offsetX = mouseX - p.x;
      offsetY = mouseY - p.y;
      
      svg.style.cursor = "grabbing";
    });

    const onMouseMove = (e) => {
      if (isDragging && draggingNode === p) {
        hasMoved = true;
        
        const rect = svg.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panX) / zoom;
        const mouseY = (e.clientY - rect.top - panY) / zoom;
        
        p.x = mouseX - offsetX;
        p.y = mouseY - offsetY;
        
        draw(true);
      }
    };

    const onMouseUp = () => {
      if (isDragging && draggingNode === p) {
        isDragging = false;
        draggingNode = null;
        svg.style.cursor = "grab";
        
        if (!hasMoved) {
          if (selectedPersonnages.has(p.nom)) {
            selectedPersonnages.delete(p.nom);
          } else {
            selectedPersonnages.add(p.nom);
          }
          draw(false, true);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    mainGroup.appendChild(g);
  });
  
  svg.appendChild(mainGroup);
}

document.getElementById("resetBtn").addEventListener("click", () => {
  selectedPersonnages.clear();
  document.getElementById("searchName").value = "";
  draw(false, true);
});

document.getElementById("searchName").addEventListener("input", () => {
  const search = document.getElementById("searchName").value.toLowerCase();
  
  selectedPersonnages.clear();
  
  if (search) {
    // Trouver tous les personnages qui correspondent à la recherche
    personnages.forEach(p => {
      if (p.nom.toLowerCase().includes(search)) {
        selectedPersonnages.add(p.nom);
      }
    });
  }
  
  draw();
});

document.querySelectorAll(".sidebar input[type='checkbox']").forEach(cb =>
  cb.addEventListener("change", () => draw(false, true))
);

svg.addEventListener("wheel", e => {
  e.preventDefault();
  const zoomAmount = e.deltaY * -0.001;
  const oldZoom = zoom;
  zoom = Math.min(Math.max(0.5, zoom + zoomAmount), 3);
  const rect = svg.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
  panY = mouseY - (mouseY - panY) * (zoom / oldZoom);
  draw();
});

// Gestion du pan (déplacement du fond)
svg.addEventListener("mousedown", e => {
  if (e.target === svg || e.target.tagName === 'defs') {
    isPanning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    svg.style.cursor = "grabbing";
  }
});

window.addEventListener("mousemove", e => {
  if (isPanning) {
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    draw();
  }
});

window.addEventListener("mouseup", () => {
  if (isPanning) {
    isPanning = false;
    svg.style.cursor = "grab";
  }
});

window.addEventListener("resize", () => {
  width = grapheContainer.clientWidth*2;
  height = grapheContainer.clientHeight*2;
});

draw();

const toggleRelationsBtn = document.getElementById("toggleRelationsBtn");
const relationsCheckboxes = document.querySelectorAll('.sidebar input[data-type]');

toggleRelationsBtn.addEventListener("click", () => {
  const allChecked = Array.from(relationsCheckboxes).every(cb => cb.checked);
  
  relationsCheckboxes.forEach(cb => {
    cb.checked = !allChecked;
  });
  
  // Mettre à jour le texte du bouton
  toggleRelationsBtn.textContent = allChecked ? "Tout cocher" : "Tout décocher";
  
  draw(false, true);
});

const toggleGroupesBtn = document.getElementById("toggleGroupesBtn");
const groupesCheckboxes = document.querySelectorAll('.sidebar input[data-group]');

toggleGroupesBtn.addEventListener("click", () => {
  const allChecked = Array.from(groupesCheckboxes).every(cb => cb.checked);
  
  groupesCheckboxes.forEach(cb => {
    cb.checked = !allChecked;
  });
  
  // Mettre à jour le texte du bouton
  toggleGroupesBtn.textContent = allChecked ? "Tout cocher" : "Tout décocher";
  
  draw(false, true);
});


