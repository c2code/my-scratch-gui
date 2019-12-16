import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import storage from '../lib/storage';
import {projectTitleInitialState} from '../reducers/project-title';
import html2canvas from './html2canvas.min';


/**
 * Project saver component passes a saveProject function to its child.
 * It expects this child to be a function with the signature
 *     function (saveProject, props) {}
 * The component can then be used to attach project saving functionality
 * to any other component:
 *
 * <ProjectSaver>{(saveProject, props) => (
 *     <MyCoolComponent
 *         onClick={saveProject}
 *         {...props}
 *     />
 * )}</ProjectSaver>
 */
class HomeworkToServer extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'createProject',
            'updateProject',
            'SaveProject',
            'doStoreProject',
            'getPicture'
        ]);
    }
    SaveProject () {
        this.props.saveProjectSb3().then(content => {
            this.getPicture(this.props, content);
        });
        this.doStoreProject();
        this.updateProject();

    }

    getPicture (props, content){
        html2canvas(document.getElementsByClassName('stage_stage-wrapper_eRRuk box_box_2jjDp')[0])
            .then(canvas => {
                const image = new Image();
                image.src = canvas.toDataURL('image/png');
                const bytes = window.atob(image.src.split(',')[1]);
                // 处理异常,将ascii码小于0的转换为大于0
                const ab = new ArrayBuffer(bytes.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < bytes.length; i++) {
                    ia[i] = bytes.charCodeAt(i);
                }
                const imgblob = new Blob([ab], {type: 'image/png'});
                if (imgblob.size < 4300){
                    this.getPicture(props, content);
                } else {
                    console.log(imgblob.size);
                    //document.body.appendChild(canvas);// 在界面下方生成一个div,展示截取到的作品缩略图

                    const xmlhttp = new XMLHttpRequest();
                    const url = 'http://localhost:8088/api/homework/image';
                    const form = new FormData();
                    form.append('upload', imgblob, 'image.png');
                    /*xmlhttp.onreadystatechange = function stateChange (){
                        if (xmlhttp.readyState === 4){
                            console.log(xmlhttp);
                            alert('保存成功');
                        }
                    };*/
                    let usernameStr = '';
                    const usernames = document.cookie.split(';');
                    for (let count =0; count < usernames.length; count++){
                        const username = usernames[count].split('=');
                        if(username[0].toString() === 'username' || username[0].toString() === ' username'){
                            usernameStr = username[1].toString();
                        }
                    }

                    //获取http请求中的参数ha，user，cid
                    //console.log(document.location.search.split('&')[0].split('=')[1].toString())
                    //console.log(document.location.search.split('&')[1].split('=')[1].toString())
                    //console.log(document.location.search.split('&')[2].split('=')[1].toString())

                    xmlhttp.open('POST', url, true);
                    xmlhttp.setRequestHeader('Authorization', document.location.search.split('&')[0].split('=')[1].toString());
                    form.append('uid', document.location.search.split('&')[1].split('=')[1].toString());   
                    form.append('cid', document.location.search.split('&')[2].split('=')[1].toString());   
                    xmlhttp.send(form);
                }
            });
    }

    doStoreProject () {
        this.props.saveProjectSb3()
            .then(content => {
                const xmlhttp = new XMLHttpRequest();
                const url = 'http://localhost:8088/api/homework/upload';
                xmlhttp.open('POST', url, true);
                xmlhttp.setRequestHeader('Authorization', document.location.search.split('&')[0].split('=')[1].toString());
                const body = new FormData();
                body.append('upload', content, 'sb3_file');
                body.append('uid', document.location.search.split('&')[1].split('=')[1].toString());   
                body.append('cid', document.location.search.split('&')[2].split('=')[1].toString());   
                xmlhttp.send(body);
            });
        alert('提交作业成功!');
    }
    createProject () {
        return this.doStoreProject();
    }
    updateProject () {
        var data;
        const xmlhttp = new XMLHttpRequest();
        const url = 'http://localhost:8088/api/homework/update';
        xmlhttp.open('POST', url, true);
        xmlhttp.setRequestHeader('Authorization', document.location.search.split('&')[0].split('=')[1].toString());
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        var uid = document.location.search.split('&')[1].split('=')[1].toString();
        var cid = document.location.search.split('&')[2].split('=')[1].toString();
        data = JSON.stringify({"hstatus": "已提交", "uid":uid*1, "cid":cid*1});
        xmlhttp.send(data);
    }
    render () {
        const {
            children
        } = this.props;
        return children(
            this.SaveProject,
            this.updateProject,
            this.createProject
        );
    }
}

const getProjectFilename = (curTitle, defaultTitle) => {
    let filenameTitle = curTitle;
    if (!filenameTitle || filenameTitle.length === 0) {
        filenameTitle = defaultTitle;
    }
    return `${filenameTitle.substring(0, 100)}.sb3`;
};

HomeworkToServer.propTypes = {
    children: PropTypes.func,
    projectFilename: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    saveProjectSb3: PropTypes.func
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm),
    projectFilename: getProjectFilename(state.scratchGui.projectTitle, projectTitleInitialState),
    projectId: state.scratchGui.projectId
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(HomeworkToServer);
