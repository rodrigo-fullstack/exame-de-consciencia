(function () {
  "use strict";

  // Use a URL do projeto e a chave publicável do Supabase.
  var projectUrl = "https://hewxzrbanwygfsmwxzdz.supabase.co";
  var publishableKey = "sb_publishable_wiAuTbYUdmv6GK18L--j7g_PuHcbdou";
  var endpoint = projectUrl.replace(/\/$/, "") + "/rest/v1/igrejas";
  var configured = Boolean(projectUrl && publishableKey);
  var pageSize = 20;
  var cursor = null;
  var loading = false;

  var form = document.getElementById("church-form");
  var submit = form.querySelector("button[type=submit]");
  var saveStatus = document.getElementById("church-save-status");
  var listStatus = document.getElementById("church-list-status");
  var results = document.getElementById("church-results");
  var more = document.getElementById("church-more");
  document.getElementById("church-unavailable").hidden = configured;
  form.hidden = !configured;

  function addChurch(church) {
    var card = document.createElement("li");
    card.className = "box";
    var name = document.createElement("h3");
    name.textContent = church.name;
    var schedule = document.createElement("p");
    schedule.textContent = "Horários de confissão: " + church.schedule;
    var address = document.createElement("p");
    address.textContent = church.address;
    var map = document.createElement("a");
    map.href = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(church.name + ", " + church.address);
    map.target = "_blank";
    map.rel = "noopener noreferrer";
    map.textContent = "Abrir no mapa";
    map.setAttribute("aria-label", "Abrir " + church.name + " no mapa");
    card.append(name, schedule, address, map);
    results.appendChild(card);
  }

  async function loadChurches(reset) {
    if (!configured || loading) return;
    if (reset) {
      cursor = null;
      results.replaceChildren();
    }
    loading = true;
    more.disabled = true;
    listStatus.textContent = "Carregando igrejas…";
    var query = new URLSearchParams({
      select: "id,name,schedule,address",
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
      churches.forEach(addChurch);
      if (churches.length) cursor = churches[churches.length - 1].id;
      more.hidden = page.length <= pageSize;
      more.textContent = "Carregar mais igrejas";
      listStatus.textContent = results.childElementCount ? "" : "Nenhuma igreja cadastrada.";
    } catch (error) {
      listStatus.textContent = "Não foi possível consultar as igrejas. Verifique sua conexão.";
      more.textContent = "Tentar novamente";
      more.hidden = false;
    } finally {
      loading = false;
      more.disabled = false;
    }
  }

  form.addEventListener("input", function (event) {
    if (event.target.name) event.target.setCustomValidity("");
  });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!configured || submit.disabled) return;
    var church = {};
    for (var field of ["name", "schedule", "address"]) {
      var input = form.elements.namedItem(field);
      church[field] = input.value.trim();
      if (!church[field]) {
        input.setCustomValidity("Preencha este campo.");
        input.reportValidity();
        return;
      }
    }

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
      await currentLoad;
      refresh();
    } catch (error) {
      saveStatus.textContent = "Não foi possível cadastrar a igreja. Tente novamente.";
    } finally {
      submit.disabled = false;
    }
  });

  var currentLoad;
  function refresh() {
    if (!loading) currentLoad = loadChurches(true);
  }
  more.addEventListener("click", function () {
    currentLoad = loadChurches(cursor === null);
  });
  function loadOnRoute() {
    if (location.hash === "#igrejas") refresh();
  }
  window.addEventListener("hashchange", loadOnRoute);
  loadOnRoute();
})();
