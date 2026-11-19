(function () {
  "use strict";

  // Use a URL do projeto e a chave publicável do Supabase.
  var projectUrl = "https://hewxzrbanwygfsmwxzdz.supabase.co";
  var publishableKey = "sb_publishable_wiAuTbYUdmv6GK18L--j7g_PuHcbdou";
  var endpoint = projectUrl.replace(/\/$/, "") + "/rest/v1/igrejas";
  var configured = Boolean(projectUrl && publishableKey);
  var pageSize = 4;
  var pages = [null];
  var nextCursor = null;
  var retryPages = pages;
  var loading = false;
  var addressFields = [
    ["street", "Rua"],
    ["neighborhood", "Bairro"],
    ["street_number", "Número"],
    ["city_uf", "Cidade/UF"]
  ];

  var form = document.getElementById("church-form");
  var submit = form.querySelector("button[type=submit]");
  var saveStatus = document.getElementById("church-save-status");
  var listStatus = document.getElementById("church-list-status");
  var results = document.getElementById("church-results");
  var previous = document.getElementById("church-prev");
  var more = document.getElementById("church-more");
  var retry = document.getElementById("church-retry");
  document.getElementById("church-unavailable").hidden = configured;
  form.hidden = !configured;

  function addChurch(church) {
    var card = document.createElement("li");
    card.className = "box";
    var name = document.createElement("h3");
    name.textContent = church.name;
    var schedule = document.createElement("p");
    schedule.textContent = "Horários de confissão: " + church.schedule;
    var address = document.createElement("dl");
    address.className = "church-address";
    addressFields.forEach(function (field) {
      var row = document.createElement("div");
      var label = document.createElement("dt");
      var value = document.createElement("dd");
      label.textContent = field[1] + ":";
      value.textContent = church[field[0]] || "Não informado";
      row.append(label, value);
      address.appendChild(row);
    });
    var incompleteAddress = addressFields.some(function (field) { return !church[field[0]]; });
    var map = document.createElement("a");
    map.href = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(church.name + ", " + church.address);
    map.target = "_blank";
    map.rel = "noopener noreferrer";
    map.textContent = "Abrir no mapa";
    map.setAttribute("aria-label", "Abrir " + church.name + " no mapa");
    card.append(name, schedule, address);
    if (incompleteAddress) {
      var legacyAddress = document.createElement("p");
      legacyAddress.textContent = "Endereço informado: " + church.address;
      card.appendChild(legacyAddress);
    }
    card.appendChild(map);
    results.appendChild(card);
  }

  async function loadChurches(targetPages) {
    if (!configured || loading) return;
    var cursor = targetPages[targetPages.length - 1];
    loading = true;
    previous.disabled = more.disabled = retry.disabled = true;
    listStatus.textContent = "Carregando igrejas…";
    var query = new URLSearchParams({
      select: "id,name,schedule,address,street,neighborhood,street_number,city_uf",
      order: "id.desc",
      limit: String(pageSize + 1)
    });
    if (cursor !== null) query.set("id", "lt." + cursor);

    try {
      var response = await fetch(endpoint + "?" + query, {
        headers: { apikey: publishableKey },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Falha na consulta");
      var page = await response.json();
      var churches = page.slice(0, pageSize);
      results.replaceChildren();
      churches.forEach(addChurch);
      pages = targetPages;
      nextCursor = page.length > pageSize ? churches[churches.length - 1].id : null;
      previous.hidden = pages.length === 1;
      more.hidden = nextCursor === null;
      retry.hidden = true;
      listStatus.textContent = churches.length ? "" : (pages.length === 1 ?
        "Nenhuma igreja cadastrada." : "Nenhuma igreja cadastrada nesta página.");
    } catch (error) {
      listStatus.textContent = "Não foi possível consultar as igrejas. Verifique sua conexão.";
      retryPages = targetPages;
      retry.hidden = false;
    } finally {
      loading = false;
      previous.disabled = more.disabled = retry.disabled = false;
    }
  }

  form.addEventListener("input", function (event) {
    if (event.target.name) event.target.setCustomValidity("");
  });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!configured || submit.disabled) return;
    var church = {};
    for (var field of ["name", "schedule"].concat(addressFields.map(function (entry) { return entry[0]; }))) {
      var input = form.elements.namedItem(field);
      church[field] = input.value.trim();
      if (!church[field]) {
        input.setCustomValidity("Preencha este campo.");
        input.reportValidity();
        return;
      }
    }
    var cityUf = church.city_uf.match(/^([^/]+?)\s*\/\s*([a-z]{2})$/i);
    if (!cityUf || !cityUf[1].trim()) {
      var cityInput = form.elements.namedItem("city_uf");
      cityInput.setCustomValidity("Informe cidade e UF no formato Salvador/BA.");
      cityInput.reportValidity();
      return;
    }
    church.city_uf = cityUf[1].trim() + "/" + cityUf[2].toUpperCase();
    church.address = [church.street, church.street_number, church.neighborhood, church.city_uf].join(", ");

    submit.disabled = true;
    saveStatus.textContent = "Cadastrando igreja…";
    try {
      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(church)
      });
      if (response.status === 409) {
        saveStatus.textContent = "Já existe uma igreja cadastrada com esse nome e endereço.";
        return;
      }
      if (!response.ok) throw new Error("Falha no cadastro");
      form.reset();
      saveStatus.textContent = "Igreja cadastrada e disponível para consulta pública.";
    } catch (error) {
      saveStatus.textContent = "Não foi possível cadastrar a igreja. Tente novamente.";
    } finally {
      submit.disabled = false;
    }
  });

  previous.addEventListener("click", function () {
    if (pages.length > 1) loadChurches(pages.slice(0, -1));
  });
  more.addEventListener("click", function () {
    if (nextCursor !== null) loadChurches(pages.concat(nextCursor));
  });
  retry.addEventListener("click", function () {
    loadChurches(retryPages);
  });
  function loadOnRoute() {
    if (location.hash === "#igrejas") loadChurches([null]);
  }
  window.addEventListener("hashchange", loadOnRoute);
  loadOnRoute();
})();
