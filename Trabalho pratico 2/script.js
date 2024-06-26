const MY_GITHUB_USERNAME = "victoryns";
/** @type {HTMLFormElement} */
const webappHeaderFormSearchElem = document.querySelector("#webapp-header-form-search");

// Cria uma instacia do axios para usar a API do github
// CORS GitHub: https://docs.github.com/pt/rest/overview/resources-in-the-rest-api#cross-origin-resource-sharing
const axiosInstance = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    // https://docs.github.com/pt/rest/overview/resources-in-the-rest-api#current-version
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "victoryns",
  },
});

//
// Funções relacionadas a API do GitHub
//

async function getAUser(username) {
  // https://docs.github.com/pt/rest/reference/users#get-a-user
  const apiRes = await axiosInstance.get(`/users/${username}`);
  return apiRes.data;
}

async function getListRepositoriesForAUser(username) {
  // https://docs.github.com/pt/rest/reference/repos#list-repositories-for-a-user
  // TODO: per_page=10
  const apiRes = await axiosInstance.get(`/users/${username}/repos`, { params: { sort: "updated" } });
  return apiRes.data;
}

async function rateLimit() {
  try {
    const apiRes = await axiosInstance.get("/rate_limit");
    console.debug(apiRes);
  } catch (error) {
    console.error(error);
  }
}

//
// Funções relacionadas ao Web App
//

async function loadUserInfo() {
  let userApiData;
  try {
    userApiData = await getAUser(MY_GITHUB_USERNAME);
  } catch (error) {
    console.error(error);
    return;
  }

  const userInfo = {
    homePageUrl: userApiData.html_url,
    name: userApiData.name,
    username: userApiData.login,
    location: userApiData.location,
    bio: userApiData.bio,
    profilePictureUrl: userApiData.avatar_url,
    createdAt: new Date(userApiData.created_at),
  };

  const profileSectionPictureElem = document.querySelector("#profile-section-picture");
  const profileSectionNameElem = document.querySelector("#profile-section-name");
  const profileSectionUsernameElem = document.querySelector("#profile-section-username");
  const profileSectionAbout = document.querySelector("#profile-section-about");
  const profileSectionLocation = document.querySelector("#profile-section-location");
  const profileSectionCreatedAt = document.querySelector("#profile-section-created-at");

  profileSectionPictureElem.src = userInfo.profilePictureUrl;
  profileSectionNameElem.innerText = userInfo.name;
  profileSectionUsernameElem.innerText = userInfo.username;
  profileSectionUsernameElem.href = userInfo.homePageUrl;
  profileSectionAbout.innerText = userInfo.bio;
  profileSectionLocation.innerText = userInfo.location;
  profileSectionCreatedAt.innerText = userInfo.createdAt.toLocaleDateString("default", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function updateProfileSectionRepositories() {
  /** @type {Array<any>} */
  let userReposApiData;
  try {
    userReposApiData = await getListRepositoriesForAUser(MY_GITHUB_USERNAME);
  } catch (error) {
    console.error(error);
    return;
  }

  const userRepos = userReposApiData.map(({ name, language, updated_at, html_url }) => ({
    name,
    language,
    // updatedAt: new Date(updated_at),
    updatedAtISO: updated_at,
    url: html_url,
  }));

  const profileSectionRepositoriesElem = document.querySelector("#profile-section-repositories");
  profileSectionRepositoriesElem.innerHTML = "";
  for (const repo of userRepos) {
    const repositoryEl = document.createElement("a");
    repositoryEl.target = "_blank";
    repositoryEl.href = repo.url;
    repositoryEl.classList.add("profile-section__repositories_repository");
    repositoryEl.innerHTML = `
      <h4>${repo.name}</h4>
      <div>
        <span>${repo.language != null ? repo.language : ""}</span>
        <span>Atualizado ${luxon.DateTime.fromISO(repo.updatedAtISO).toRelativeCalendar()}</span>
      </div>
    `;
    profileSectionRepositoriesElem.appendChild(repositoryEl);
  }
}

function handleFormSearchSubmit(event) {
  event.preventDefault();
  const searchTxt = webappHeaderFormSearchElem.elements.search.value;
  if (!searchTxt) {
    Swal.fire("Opss...", "Você precisa digitar algo na barra de pesquisa", "info");
    return;
  }
  // Limpa o campo de busca
  webappHeaderFormSearchElem.elements.search.value = "";

  // https://developer.mozilla.org/pt-BR/docs/Web/API/URLSearchParams
  // https://www.valentinog.com/blog/url/
  // https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
  // Cria uma url com quer params no modelo: `search.html?q=Projetos+Javascript`
  const searchUrl = new URL("search.html", window.location);
  searchUrl.searchParams.set("q", searchTxt);
  console.debug(searchUrl, searchUrl.href);

  // https://www.w3schools.com/howto/howto_js_redirect_webpage.asp
  // Redirecional para o url criado
  window.location.href = searchUrl.href;
}

webappHeaderFormSearchElem.addEventListener("submit", handleFormSearchSubmit);
loadUserInfo();
updateProfileSectionRepositories();