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
class FileToServer extends React.Component {
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
                    // document.body.appendChild(canvas);// 在界面下方生成一个div,展示截取到的作品缩略图
                    const xmlhttp = new XMLHttpRequest();
                    const url = 'http://test.tuopinpin.com/test/gui/';
                    const form = new FormData();
                    form.append('image', imgblob, 'image.png');
                    xmlhttp.onreadystatechange = function stateChange (){
                        if (xmlhttp.readyState === 4){
                            console.log(xmlhttp);
                            alert('保存成功');
                        }
                    };
                    let usernameStr = '';
                    const usernames = document.cookie.split(';');
                    for (let count =0; count < usernames.length; count++){
                        const username = usernames[count].split('=');
                        if(username[0].toString() === 'username' || username[0].toString() === ' username'){
                            usernameStr = username[1].toString();
                        }
                    }
                    xmlhttp.open('POST', url, true);
                    form.append('file', content);
                    form.append('author', usernameStr);
                    form.append('name', props.projectFilename);
                    form.append('update_time', 'test_0');
                    form.append('create_time', 'test_1');
                    form.append('is_Scratch3', 'true');
                    form.append('format_class', '0');
                    form.append('lesson', 'scratch3_test');
                    //if (usernameStr === ''){
                    //    alert ('please login');
                    //} else {
                        xmlhttp.send(form);
                    //}
                }
            });
    }

    doStoreProject (id) {
        return this.props.saveProjectSb3()
            .then(content => {
                const assetType = storage.AssetType.Project;
                const dataFormat = storage.DataFormat.SB3;
                const body = new FormData();
                body.append('sb3_file', content, 'sb3_file');
                return storage.store(
                    assetType,
                    dataFormat,
                    body,
                    id
                );
            });
    }
    createProject () {
        return this.doStoreProject();
    }
    updateProject () {
        return this.doStoreProject(this.props.projectId);
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

FileToServer.propTypes = {
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
)(FileToServer);
