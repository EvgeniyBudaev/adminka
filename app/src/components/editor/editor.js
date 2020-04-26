import React, { Component, Fragment } from 'react';
import axios from 'axios';
import "../../helpers/iframeLoader.js";
import DOMHelper from '../../helpers/dom-helper';
import EditorText from '../editor-text/editor-text';

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
    this.currentPage = page;

    axios.get(`../../../${page}?rnd=${Math.random()}`)
      // С сервера получили строку и парсим её в DOM структуру
      .then(res => DOMHelper.parseStrToDOM(res.data))
      // Оборачиваем все текстовые узлы. тут чистая копия 
      .then(DOMHelper.wrapTextNodes)
      // Сохраняем чистую копию в виртуальный DOM
      .then(dom => {
        this.virtualDom = dom;
        return dom;
      })
      // Для отправки на сервер преобразуем DOM в строку
      .then(DOMHelper.serializeDOMToString)
      .then(html => axios.post("../../../api/saveTempPage.php", { html }))
      .then(() => this.iframe.load("../../../temp.html"))
      // Включаем редактирование элементов
      .then(() => this.enableEditing())
      // Стили при редактировании
      .then(() => this.injectStyles())
  }

  save() {
    const newDom = this.virtualDom.cloneNode(this.virtualDom);
    DOMHelper.unwrapTextNodes(newDom);
    const html = DOMHelper.serializeDOMToString(newDom);
    console.log('[html] ', html);
    axios
      .post("../../../api/savePage.php", { pageName: this.currentPage, html })
  }

  // Редактирование
  enableEditing() {
    this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
      const id = element.getAttribute("nodeid");
      const virtualElement = this.virtualDom.body.querySelector(`[nodeid="${id}"]`);

      new EditorText(element, virtualElement);
    });
    console.log('[enableEditing][virtualDom] ', this.virtualDom);
  }

  injectStyles() {
    const style = this.iframe.contentDocument.createElement("style");
    style.innerHTML = `
    text-editor:hover {
      outline: 3px solid orange;
      outline-offset: 8px;
    }
    text-editor:focus {
      outline: 3px solid red;
      outline-offset: 8px;
    }`;
    this.iframe.contentDocument.head.appendChild(style);
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
      <Fragment>
        <button onClick={() => this.save()}>Сохранить</button>
        <iframe src={this.currentPage} frameBorder="0"></iframe>
      </Fragment>


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


