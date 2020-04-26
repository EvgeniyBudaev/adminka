import React, { Component, Fragment } from 'react';
import axios from 'axios';
import "../../helpers/iframeLoader.js";

export default class Editor extends Component {
  constructor() {
    super();
    this.currentPage = "index.html";

    this.state = {
      pageList: [],
      newPageName: ''
    }
    this.createNewPage = this.createNewPage.bind(this);
  }

  componentDidMount() {
    this.init(this.currentPage);
  }

  init(page) {
    this.iframe = document.querySelector("iframe");
    this.open(page);
    this.loadPageList();
  }

  open(page) {
    // Записываем ту страницу, которую нужно открыть и сбрасываем кеширование
    this.currentPage = `../../../${page}?rnd=${Math.random()}`;

    axios.get(`../../../${page}`)
      // С сервера получили строку и парсим её в DOM структуру
      .then(res => this.parseStrToDOM(res.data))
      // Оборачиваем все текстовые узлы. тут чистая копия 
      .then(this.wrapTextNodes)
      // Сохраняем чистую копию в виртуальный DOM
      .then(dom => {
        this.virtualDom = dom;
        return dom;
      })
      // Для отправки на сервер преобразуем DOM в строку
      .then(this.serializeDOMToString)
      .then(html => axios.post("../../../api/saveTempPage.php", { html }))
      .then(() => this.iframe.load("../../../temp.html"))
      // Включаем редактирование элементов
      .then(() => this.enableEditing())
  }

  // Редактирование
  enableEditing() {
    this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
      element.contentEditable = "true";
      // Синхронизуем чистую и грязную копии
      // element.addEventListener("input", () => {
      //   this.onTextEdit(element);
      // })
    });
    console.log(this.virtualDom);
  }

  onTextEdit(element) {
    console.log('[onTextEdit][element] ', element);
    const id = element.getAttribute("nodeid");
    this.virtualDom.body.querySelector(`[nodeid="${id}"]`).innerHTML = element.innerHTML;
  }

  // Строки превращаем в DOM структуру
  parseStrToDOM(str) {
    const parser = new DOMParser();
    return parser.parseFromString(str, "text/html");
  }

  //Оборачиваем текстовые ноды во враперы
  wrapTextNodes(dom) {
    const body = dom.body;
    let textNodes = [];

    function recursy(element) {
      element.childNodes.forEach(node => {

        if (node.nodeName === "#text" && node.nodeValue.replace(/\s+/g, "").length > 0) {
          textNodes.push(node);
        } else {
          recursy(node);
        }

      })
    }

    recursy(body);

    textNodes.forEach((node, i) => {
      const wrapper = dom.createElement('text-editor');
      node.parentNode.replaceChild(wrapper, node);
      wrapper.appendChild(node);
      wrapper.setAttribute("nodeid", i);
    });

    return dom;
  }

  // Превращаем DOM структуры в строку для отправки на сервер
  serializeDOMToString(dom) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(dom);
  }

  // Загрузка страниц из API
  loadPageList() {
    axios.get("../../../api")
      .then(res => this.setState({ pageList: res.data }))
  }

  // Создание новой страницы
  createNewPage() {
    axios
      .post("../../../api/createNewPage.php", { "name": this.state.newPageName })
      .then(this.loadPageList())
      .catch(() => alert("Страница уже существует!"))
  }

  // Удаление страницы
  deletePage(page) {
    axios
      .post("../../../api/deletePage.php", { "name": page })
      .then(this.loadPageList())
      .catch(() => alert("Страницы не существует!"))
  }


  render() {
    // const { pageList } = this.state;
    // console.log("pageList ", pageList);
    // const pages = pageList.map((page, index) => {
    //   return (
    //     <h1 key={index}>
    //       {page}
    //       <a
    //         href="#"
    //         onClick={() => this.deletePage(page)}
    //       >
    //         (x)
    //       </a>
    //     </h1>
    //   )
    // })

    return (
      <iframe src={this.currentPage} frameBorder="0"></iframe>

      // <Fragment>
      //   <input
      //     onChange={(e) => { this.setState({ newPageName: e.target.value }) }}
      //     type="text" />
      //   <button onClick={this.createNewPage}>Создать страницу</button>
      //   <h1>Заголовки страниц:</h1>
      //   {pages}
      // </Fragment>
    )
  }
}


