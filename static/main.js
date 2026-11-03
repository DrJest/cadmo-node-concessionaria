async function renderTable(endpoint, page, pageSize, order, q) {
  document.querySelector("#title").innerText = endpoint;
  const url = new URL(location.host + "/api/v1/" + endpoint);
  url.searchParams.set("page", page || 1);
  url.searchParams.set("pageSize", pageSize || 25);
  url.searchParams.set("order", order || "id");
  url.searchParams.set("q", JSON.stringify(q || {}));
  console.log(url.toString());
  const data = await fetch("http://" + url.toString());
  const json = await data.json();
  const table = document.createElement("table");
  table.classList.add("table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  table.appendChild(thead);
  thead.appendChild(header);
  const th1 = document.createElement("th");
  th1.innerText = "ID";
  header.appendChild(th1);
  const th2 = document.createElement("th");
  th2.innerText = "Nome";
  header.appendChild(th2);
  const th3 = document.createElement("th");
  th3.innerText = "Logo";
  header.appendChild(th3);
  const th4 = document.createElement("th");
  th4.innerText = "Anno";
  header.appendChild(th4);
  const tbody = document.createElement("tbody");
  for (let row of json.data) {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.name}</td>
      <td><a href="${row.logo}" target="_blank">${row.logo}</a></td>
      <td>${row.foundation_year || "-"}</td>
    `;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  document.querySelector("#main").innerHTML = "";
  document.querySelector("#main").appendChild(table);
}
