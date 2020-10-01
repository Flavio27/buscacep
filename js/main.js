const CEP_API_URL = "https://viacep.com.br/ws/"
const JSON_FORMAT = "/json"
const HTTP_STATUS_OK = 200
const GOOGLE_MAPS_GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json?address="
const GOOGLE_API_KEY = "&key=AIzaSyDrM2JAFNh8SiW7pIEnvBcoj6JIEyFWpxo"
const MOCK_API_URL = "http://5c251c85cfdadd0014d14b4b.mockapi.io/api/address"
const currentAddressKey = "currentAddress"

async function getLatitudeAndLongitude(address) {
    const URIAddress = address.logradouro ?
        `${address.logradouro.replace(/\ /g, "+")},+${address.localidade.replace(/\ /g, "+")}` :
        `${address.localidade.replace(/\ /g, "+")}`

    const response = await fetch(`${GOOGLE_MAPS_GEOCODE_ENDPOINT + URIAddress + GOOGLE_API_KEY}`)
    const coordenates = await response.json()
    return coordenates.results[0].geometry.location
}

async function renderResult(address) {

    const rawAddresses = await fetch(`${MOCK_API_URL}`)
    const addresses = await rawAddresses.json()
    const isNewAddress = addresses.some(a => a.cep.toString().replace(/\-/g, "") == address.cep.toString().replace(/\-/g, ""))
    document.querySelector('#limpar').innerHTML = `<button onclick="clean()" class="btn btn-dark" id="limpar">Limpar</button>`

    getLatitudeAndLongitude(address).then(coordenates => {
        address.latitude = coordenates.lat
        address.longitude = coordenates.longitude
        document.querySelector("#addressResult").style.display = "block"
        document.querySelector("#sectionCEP").style.display = "none"

        const addressView = `
        <div class="container">
            <table class="table table-bordered">
                <thead>
                    <td colspan="2">
                    <span id="saveAlert"></span>
                    <h3>Detalhes do endereço</h3>
                    
                    </td>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Cidade </th>
                        <td>${address.localidade}</td>
                    </tr>
                    <tr>
                        <th scope="row">UF </th>
                        <td>${address.uf}</td>
                    </tr>
                    <tr>
                        <th scope="row">CEP </th>
                        <td>${address.cep}</td>
                    </tr>
                    <tr>
                        <th scope="row">Latitude </th>
                        <td>${coordenates.lat}</td>
                    </tr>
                    <tr>
                        <th scope="row">Longitude </th>
                        <td>${coordenates.lng}</td>
                    </tr>
                </tbody>
            </table>
            
            ${!isNewAddress ? `<button id="buttonSaveAddress" onclick="saveAddress()" class="btn btn-dark">Salvar</button>` :
                `<span id="AlrRegist">
                    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-exclamation-circle-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                    </svg>
                    Endereço cadastrado!</span><br><br>
                <button id="buttonSaveAddress" onclick="clean(showCEPs())" class="btn btn-dark">Lista de CEPs</button>`}
            <button onclick="clean()" class="btn btn-dark">Voltar</button>
        </div>
    </section>
        `
        document.querySelector("#addressDetail").innerHTML = addressView



        const map = new google.maps.Map(document.getElementById('map'), {
            center: coordenates,
            zoom: 15
        });

        let locationPoint = { lat: coordenates.lat, lng: coordenates.lng };

        var marker = new google.maps.Marker({
            position: locationPoint,
            map: map,
            title: `Localização do CEP: ${address.cep}`
        });

        sessionStorage.setItem(currentAddressKey, JSON.stringify({
            state: address.uf,
            city: address.localidade,
            cep: address.cep,
            address: address.logradouro,
            latitude: coordenates.lat,
            longitude: coordenates.lng,
        }))

    }).catch((error) => {
        alert(`Erro durante o recebimento da latitude e longitude da api do google maps, info: ${error}`)
    })
}

function getCEP(cep) {
    cep = cep.toString().replace(/\-/g, "")

    if (cep.length !== 8) {
        document.querySelector('#cepAlertFail').innerHTML = `CEP inválido ou inexistente!`
        return
    } else {
        const xmlHttpRequest = new XMLHttpRequest()

        xmlHttpRequest.onreadystatechange = () => {
            if (xmlHttpRequest.readyState == XMLHttpRequest.DONE && xmlHttpRequest.status == HTTP_STATUS_OK) {
                renderResult(JSON.parse(xmlHttpRequest.responseText))
                document.querySelector('#cepAlertFail').innerHTML = ``
                return
            }
        }

        xmlHttpRequest.open("GET", `${CEP_API_URL + cep + JSON_FORMAT}`)
        xmlHttpRequest.send()
    }
}

function editSucess() {
    const msgSucess = document.querySelector('#editOrDelet')
    msgSucess.innerHTML = `<div class="alert alert-success" role="alert">Endereço foi <b>Alterado</b> com sucesso!</div>`

}

function clean() {
    document.querySelector('#cepAlertFail').innerHTML = ``
    document.querySelector('#limpar').innerHTML = ``
    document.querySelector("#textCep").value = ""
    document.querySelector("#addressResult").style.display = "none"
    document.querySelector("#sectionCEP").style.display = "block"
    const showCEPButton = document.querySelector("#showCEP")
    showCEPButton.style.display = "block"
    document.querySelector("#sectionCEP").innerHTML = showCEPButton.outerHTML
    sessionStorage.removeItem(currentAddressKey)
}

async function saveAddress() {
    const address = sessionStorage.getItem(currentAddressKey)

    if (!address) {
        document.querySelector('#saveAlert').innerHTML = `
        <div class="alert alert-success" role="alert">
            Endereço não encontrado!
        </div>`
    }

    const rawResponse = await fetch(MOCK_API_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: address
    });
    const result = await rawResponse.json();

    sessionStorage.removeItem(currentAddressKey)
    document.querySelector("#buttonSaveAddress").style.display = "none"

    document.querySelector('#saveAlert').innerHTML =
        `
    <div class="alert alert-success" role="alert">
        O endereço foi <b>salvo</b> com sucesso!
    </div>
    `
}

let putAdress = async function (adressId) {
    document.querySelector('#editOrDelet').innerHTML = ``
    const getMethod = await fetch(MOCK_API_URL + '/' + adressId, { method: 'GET' })
    if (getMethod.status == HTTP_STATUS_OK) {
        let result = await getMethod.json()

        // console.log(result.address,result.city,result.state)

        let modalResult = document.querySelector('#modalID')
        modalResult.innerHTML =
            `
    <div class="modal border border-secondary rounded" id="editModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-body">
        <h2>Informações CEP: ${result.cep}</h2>
        <hr>
        <form id="forPut2">
        <div class="form-group col-md-3">

          <label">CEP:</label>
          <input type="text" id="txtCep" value="${result.cep}" class="form-control" disabled>
        </div>
        <div class="form-group col-md-6">
          <label>Endereço:</label>
          <input type="text" class="form-control" id="txtAddress" value="${result.address}" maxLength="60 size="60"">
        </div>
        <div class="form-group col-md-3">
          <label>Cidade:</label>
          <input type="text" class="form-control" id="txtCity" value="${result.city}" maxLength="20" size="20">
        </div>
        <div class="form-group col-md-2">
          <label>Estado:</label>
          <input type="text" class="form-control" id="txtState" value="${result.state}"  onkeypress="return /[a-z]/i.test(event.key)"  maxLength="2" size="2">
        </div>
      <button class="btn btn-primary">Editar</button>
      <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
      <hr>
    </form>
        </div>
      </div>
    </div>
  </div>
        `

        // Call the modal with JQUERY
        $('#editModal').modal('show')

        let cep = document.querySelector('#txtCep')
        let address = document.querySelector('#txtAddress')
        let city = document.querySelector('#txtCity')
        let state = document.querySelector('#txtState')

        forPut2.addEventListener("submit", function (event) {
            event.preventDefault();


            // result. = can't alterate on input
            let data = {
                id: result.id,
                state: state.value,
                cep: result.value,
                latitude: result.latitude,
                longitude: result.longitude,
                city: city.value,
                address: address.value,
                details: result.details

            }

            fetch(MOCK_API_URL + '/' + adressId, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
                .then(alert('Alteração feita com sucesso!'))
                .then($('#editModal').modal('hide'))
                .then(clean())
                .then(showCEPs)
        });

    }
}

let confirmDelet = async function (adressId) {
    document.querySelector('#editOrDelet').innerHTML = ``
    const confirm = await fetch(MOCK_API_URL + '/' + adressId, { method: 'GET' })
    const result = await confirm.json()
    let divConfirm = document.querySelector('#deletConfirm')
    divConfirm.innerHTML =
        `
    <div class="modal border border-secondary rounded" id="confirm" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-body">
        <h3>Você deseja remover:</h3>
        <br>
        <span class="border-right"> <b>CEP: </b>${result.cep} &nbsp </span> &nbsp
        <span class="border-right"> <b>Cidade: </b>${result.city}&nbsp </span> &nbsp
        <span class="border-right"> <b>Endereço: </b>${result.address} &nbsp </span> &nbsp
        <span class="border-right"> <b>Estado: </b>${result.state} &nbsp </span> &nbsp
        
        <hr>
      <button class="btn btn-primary" onclick="deletAdress(${result.id})" data-dismiss="modal">Sim</button>
      <button type="button" class="btn btn-secondary" data-dismiss="modal">Não</button>
      
        </div>
      </div>
    </div>
  </div>
    `
    $('#confirm').modal('show')



}

let deletAdress = async function (adressId) {
    document.querySelector('#editOrDelet').innerHTML = ``
    const delMethod = await fetch(MOCK_API_URL + '/' + adressId, { method: 'DELETE' })
    if (delMethod.status == HTTP_STATUS_OK) {
        await clean()
        await showCEPs()
        document.querySelector('#editOrDelet').innerHTML = `<div class="alert alert-success" role="alert">Endereço foi <b>removido</b> com sucesso!</div>`
    } else {
        document.querySelector('#editOrDelet').innerHTML = `<div class="alert alert-success" role="alert">Não foi possivel <b>remover</b> o endereço!</div>`
    }


}

async function showCEPs() {
    const rawAddresses = await fetch(`${MOCK_API_URL}`)
    const addresses = await rawAddresses.json()

    const CEPView =
        `
       <span id="editOrDelet"></span>
       <h3>CEPs Cadastrados</h3>
        <ul class="list-group">
     ${addresses.map((address) =>
            ` <li class="list-group-item btn-outline-secondary">
            <span class="border-right"> <b>CEP:</b><button onclick="getCEP('${address.cep}')" class="mdc-button">${address.cep} 
            &nbsp <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-geo-alt-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
            &nbsp</button> 
            </span>&nbsp 
            <span class="border-right"> <b>Endereço: </b> ${address.address.length > 0 ? `${address.address}&nbsp</span>&nbsp
            <span class="border-right"> <b>Cidade: </b>`: ''} ${address.city}&nbsp</span>&nbsp
            <span class="border-right"> <b>Estado: </b> ${address.state}&nbsp</span>&nbsp
            <button class="btn btn-light btn-sm" onclick="putAdress(${address.id})">Alterar</button>
            <button class="btn btn-light btn-sm" onclick="confirmDelet(${address.id})">Remover</button>
        </li>   
            <div id="modalID"> 
            </div>
            <div class="container" id="deletConfirm"> 
            </div>
            `.trim()).join('')
        }
        </ul><br>
        <button onclick="clean()" class="btn btn-dark">Voltar</button>
    `
    document.querySelector("#sectionCEP").innerHTML += CEPView
    document.querySelector("#showCEP").style.display = "none"
}


window.addEventListener('load', function () {
    clean()
})
