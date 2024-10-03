import { useState } from "react";
import { communication } from "../../Core/scripts/communication.js";
import { GCard } from "../../Core/components/GCard.js";
import { GModal } from "../../Core/components/GModal.js";
import { GForm } from "../../Core/components/GForm.js";
import { validate_form } from "../../Core/scripts/form.js";
import { cast_money } from "../../Core/scripts/casts.js";
import { getContrast } from "../../Core/scripts/color.js";
import { GMoney } from "../../Core/components/GMoney.js";
import { errorAlert, successAlert } from "../../Core/scripts/alerts.js";



function AddMovimiento({after_save, initial_props}){
    //initial_props = [{...initial_props[0]}];
    //console.log("---------initial props", initial_props);
    if(!initial_props[0].accounts || !initial_props[0].tags || !initial_props[0].classifications || !initial_props[0].tag_scheme || !initial_props[0].classification_scheme || !initial_props[0].account_scheme ){
        errorAlert("Fallo la precarga del componenete agregar movimiento, comunicate con el administrador");
    }
    let show_form_account = useState(false);
    let show_form_tag = useState(false);
    let show_form_classification = useState(false);

 
    let tag_values = useState({});
    let classification_values = useState({});
    let account_values = useState({});
    let now = new Date();
    let day = ("0" + now.getDate()).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);

    let mov_value = useState(
        {description:'',
            amount:'', 
            account:initial_props[0].accounts[0].id, 
            tag:'',
            classification: initial_props[0].classifications[0].id, 
            fecha:now.getFullYear()+"-"+(month)+"-"+(day)});
    let show_first_account = useState(true);
    let tag_form_action = useState('insert');
    let tag_id = useState();
    let tag_default_values = useState({});
    let advanced_options = useState(false);

    let classification_form_action = useState('insert');
    let classification_id = useState();
    let classification_default_values = useState({});

    let account_form_action = useState('insert');
    let account_id = useState();
    let account_default_values = useState({});
    
    async function save_new_account(){
        try{
            await validate_form(account_values[0], initial_props[0].account_scheme.fields);
            let url = '/api/FinanceGuru/FGCuenta/insert';
            let respuesta_json = await communication({url, data: account_values[0]});
            let new_accounts = [...initial_props[0].accounts, {...account_values[0],id: respuesta_json.id}];
            initial_props[1]({...initial_props[0], accounts: new_accounts});
            show_form_account[1](false);
            successAlert("Todo Ok");
        }catch(err){
            
            console.log(err); errorAlert(err.message);
        }
        
    }
    
    async function save_new_tag(){
        try{
            await validate_form(tag_values[0], initial_props[0].tag_scheme.fields);
            let url = '/api/FinanceGuru/FGTag/insert';
            let respuesta_json = await communication({url, data: tag_values[0]});
            add_initial_props({...tag_values[0],id: respuesta_json.id},'tags');
            show_form_tag[1](false);
            successAlert("Todo Ok");
            
        }catch(err){
            console.log(err); errorAlert(err.message);
        } 
    }
    async function update_tag(){
        try{
            await validate_form(tag_values[0], initial_props[0].tag_scheme.fields);
            let url = '/api/FinanceGuru/FGTag/update';
            let respuesta_json = await communication({url, data: tag_values[0]});
            show_form_tag[1](false);
            
            initial_props[1]({...initial_props[0], tags: initial_props[0].tags.map((tag)=>{if(tag.id==tag_values[0].id)return tag_values[0]; else return tag})});
            successAlert("Todo Ok");
            
        }catch(err){
            console.log(err); errorAlert(err.message);
        } 
    }
    async function save_new_classification(){
        try{
            await validate_form(classification_values[0], initial_props[0].classification_scheme.fields);
            let url = '/api/FinanceGuru/FGClassification/insert';
            let respuesta_json = await communication({url, data: classification_values[0]});
            add_initial_props({...classification_values[0],id: respuesta_json.id},'classifications');
            show_form_classification[1](false);
            successAlert("Todo Ok");
            
        }catch(err){
            console.log(err); errorAlert(err.message);
        } 
    }
    async function update_classification(){
        try{
            await validate_form(classification_values[0], initial_props[0].classification_scheme.fields);
            let url = '/api/FinanceGuru/FGClassification/update';
            let respuesta_json = await communication({url, data: classification_values[0]});
            show_form_classification[1](false);
            initial_props[1]({...initial_props[0], classifications: initial_props[0].classifications.map((classification)=>{if(classification.id==classification_values[0].id)return classification_values[0]; else return classification})});
            successAlert("Todo Ok");
            
        }catch(err){
            console.log(err); errorAlert(err.message);
        } 
    }
    function add_initial_props(new_value,group){
        initial_props[1]({...initial_props[0], [group]: [...initial_props[0][group], new_value]});
    }
    
    async function save_movimiento(){
        
        try{
            if(mov_value[0].amount=='') throw {message: 'Se debe definir el monto'};
            if(mov_value[0].account==''){throw {message: 'Se debe seleccionar una cuenta'};} 
            if(mov_value[0].tag=='') throw {meesage: 'Se debe seleccionar una clasificacion'};
            let movimiento = {...mov_value[0], is_debit:'si'};
            if(!movimiento.classification) movimiento.classification = initial_props[0].classifications[0].id; 
            let url = '/api/FinanceGuru/Services/save_movimiento';
            let respuesta_json = await communication({url, data: movimiento});
            
            after_save();
        }catch(err){
            console.log("---error al guardar",err);
            errorAlert(err);
        }
        
        
    }
    async function select_account(id){
        if(mov_value[0].account!=id){
            mov_value[1](prev_value=>({...prev_value, account: id}));
        }else{
            mov_value[1](prev_value=>({...prev_value, account: ''}));
        }
    }
    async function select_tag(id){
        if(mov_value[0].tag!=id){
            mov_value[1](prev_value=>({...prev_value, tag: id}));
        }else{
            mov_value[1](prev_value=>({...prev_value, tag: ''}));
        }
        let amount_input = document.getElementById('amount');
        amount_input.scrollIntoView({ behavior: 'smooth' });
        amount_input.focus();
    }

    async function select_classification(id){
        if(mov_value[0].classification!=id){
            mov_value[1](prev_value=>({...prev_value, classification: id}));
        }else{
            mov_value[1](prev_value=>({...prev_value, classification: ''}));
        }
    }
    function onChange(id,value){
        mov_value[1](prev_value=>({...prev_value, [id]: value}));
    }
    async function delete_cost_center({id}){
        try{
            if(window.confirm("Esta seguro de eliminar el centro de costos, esto eliminara todos los gastos asociados a este centro de costos")){
                let response = await communication({url: "/api/FinanceGuru/FGClassification/delete", data: {id}});
                if(response.cod == 0) throw response.message
                successAlert("Todo Ok");
                initial_props[1]({...initial_props[0], classifications: initial_props[0].classifications.filter(classification=>(classification.id!=id))});
            }
        }catch(err){
            errorAlert(err);
        }
    }
    async function delete_tag({id}){
        try{
            if(window.confirm("Esta seguro de eliminar el Tipo de gasto, esto eliminara todos los gastos asociados a este tipo de gasto")){
                let response = await communication({url: "/api/FinanceGuru/FGTag/delete", data: {id}});
                if(response.cod == 0) throw response.message
                successAlert("Todo Ok");
                initial_props[1]({...initial_props[0], tags: initial_props[0].tags.filter(tag=>(tag.id!=id))});
                
            }
        }catch(err){
            errorAlert(err);
        }
    }
    return (
        <>
        {
        
            <GCard className="movimientos_container">
                
                <div className="tags_container  move_container">
                    <div className="container_title">
                        <div>Que tipo de gasto desea reportar? </div>
                        <div className="move_add_button" onClick={()=>{show_form_tag[1](true);}}>
                            Crear tipo de gasto
                        </div>
                    </div>
                    <div className="container_options" id="tags_container">
                        {initial_props[0]?.tags?.map((e, tag_index)=>{
                            let contraste = getContrast(e.color, '#FFFFFF');
                            let new_style = {background: e.color};
                            if(contraste>4) new_style.color = "#FFFFFF";
                            return (
                                <div className="option_container" key={tag_index}>
                                    <div className={`tag_container option`} id={e.id} onClick={()=>{select_tag(e.id)}} >
                                        <div className="tag_icon icon" style={new_style}><i  className="material-icons-outlined">{e.icon}</i></div>
                                        <div className={`tag_title title  ${mov_value[0].tag==e.id?'active':''}`}>{e.title}</div>
                                    </div>
                                    <div className="settings">
                                        <i className="material-icons">settings</i>
                                        <div className="tooltip">
                                            <div onClick={()=>{delete_tag({id: e.id})}}>Delete</div>
                                            <div onClick={()=>{
                                                show_form_tag[1](true);
                                                tag_default_values[1](e);
                                                tag_form_action[1]('update');
                                                tag_id[1](e.id);
                                            }}>Modify</div>
                                        </div>
                                    </div>
                                </div>
                        )})}
                    </div>
                </div>
                
                <div className="monto_container GForm">
                    <div className="gform-line">
                        <GMoney id="amount" value={mov_value[0].amount} field={{id:"amount", description:'Monto'}} onChange={onChange} />
                        
                        <label htmlFor="amount" className="field-description">Cuanto gasto</label>
                    </div>
                    
                    <div className="gform-line">
                        <input type="date" id="fecha" value={mov_value[0].fecha} onChange={(e)=>{onChange('fecha', e.target.value)}}/> 
                        <label htmlFor="fecha" className="field-description">Fecha que realizo el gasto</label>
                    </div>
                    <div className="gform-line description_input_line">
                        <textarea type="text" id="description" value={mov_value[0].description} onChange={(e)=>{onChange('description', e.target.value)}}/>
                        <label htmlFor="description" className="field-description">Detallar el gasto</label>
                    </div>
                    
                    
                </div>
                
                <button className="send button save_move" id="save_move" onClick={save_movimiento}>Guardar</button>
                {advanced_options[0] && 
                    <div className="advanced_options_container no_display">
                        <div className="cost_center_container move_container">
                            <div className="container_title">
                                <div>Cual es el centro de costos? </div>
                                <div className="add_btn button btn-sm bg-add sm-circle-btn" onClick={()=>{show_form_classification[1](true);}}>
                                    +
                                    <div className="tooltip bg-add">Crear nuevo centro de costos</div>
                                </div>
                            </div>
                            <div className="container_options">
                                {initial_props[0]?.classifications?.map((e)=>{
                                    let contraste = getContrast(e.color, '#FFFFFF');
                                    let new_style = {background: e.color};
                                    if(contraste>4) new_style.color = "#FFFFFF";
                                    
                                    return (<div className="option_container">
                                        <div className={`option `} id={e.id} onClick={()=>{select_classification(e.id)}} >
                                            <div className=" icon" style={new_style} ><i className="material-icons">{e.icon}</i></div>
                                            <div className={` title  ${mov_value[0].classification==e.id?'active':''}`}>{e.title}</div>
                                        </div> 
                                        <div className="settings">
                                            <i className="material-icons">settings</i>
                                            <div className="tooltip">
                                                <div onClick={()=>{delete_cost_center({id: e.id})}}>Delete</div>
                                                <div onClick={()=>{
                                                    show_form_classification[1](true);
                                                    classification_default_values[1](e);
                                                    classification_form_action[1]('update');
                                                    classification_id[1](e.id);
                                                }}>Modify</div>
                                            </div>
                                        </div>
                                    </div>);   
                                })}
                            </div>
                            
                        </div>
                        <div className=" move_container">
                            <div className="container_title">
                                <div>Con que pagará? </div>
                                <div className="add_btn button btn-sm bg-add sm-circle-btn" onClick={()=>{show_form_account[1](true);}}>
                                    +
                                    <div className="tooltip bg-add">Crear medio de pago</div>
                                </div>
                            </div>
                            <div className="container_options">
                                {initial_props[0].accounts?.map((e)=>{
                                    <div className={`account_container ${mov_value[0].account==e.id?'active':''}`} id={e.id} onClick={()=>{select_account(e.id)}} >
                                        <div className="account_title">{e.title}</div>
                                        <div className="account_icon"><i className="material-icons-outlined" style={{color: e.color}} >{e.icon}</i></div>
                                    </div>    
                                    let contraste = getContrast(e.color, '#FFFFFF');
                                    let new_style = {background: e.color};
                                    if(contraste>4) new_style.color = "#FFFFFF";
                                    
                                    return (<div className="option_container">
                                        <div className={`option `} id={e.id} onClick={()=>{select_account(e.id)}} >
                                            <div className="icon" style={new_style} ><i className="material-icons">{e.icon}</i></div>
                                            <div className={` title  ${mov_value[0].account==e.id?'active':''}`}>{e.title}</div>
                                        </div> 
                                        <div className="settings">
                                            <i className="material-icons">settings</i>
                                            <div className="tooltip">
                                                <div onClick={()=>{delete_account({id: e.id})}}>Delete</div>
                                                <div onClick={()=>{
                                                    show_form_account[1](true);
                                                    account_default_values[1](e);
                                                    account_form_action[1]('update');
                                                    account_id[1](e.id);
                                                }}>Modify</div>
                                            </div>
                                        </div>
                                    </div>);
                                })}
                            </div>
                            
                        </div>
                        
                    </div>
                    
                }
                <div className="advanced_options_trigger" onClick={(e)=>{advanced_options[1](!advanced_options[0]);}}>
                    <i className="material-icons-outlined">
                        {advanced_options[0] ? "expand_less":"expand_more"}
                    </i>
                </div>
                
                
            </GCard>
        }
        {show_form_account[0] &&
            <GModal show={show_form_account} title={`Agregar Cuenta`}>
                <GForm 
                    scheme={initial_props[0].account_scheme} 
                    values={account_values}
                    onSubmit={save_new_account} 
                    action={'insert'}
                    primary_action={'insert'}>
                    
                    <div className="preview_container">

                        <div className="preview">
                            <div className="account_title">{account_values[0].title}</div>
                            <div className="account_icon"><i className="material-icons-outlined" style={{color: account_values[0].color}} >{account_values[0].icon}</i></div>   
                        </div>
                    </div>
                </GForm>
                
            </GModal>
        }
        {show_form_tag[0] &&
            <GModal show={show_form_tag} title={`Agregar Tipo de Gasto`}>
                <GForm 
                    scheme={initial_props[0].tag_scheme} 
                    values={tag_values}
                    onSubmit={tag_form_action[0]=='insert'?save_new_tag:update_tag} 
                    action={tag_form_action[0]}
                    primary_action={tag_form_action[0]}
                    PRIMARY_ID={tag_id[0]}
                    values_base={tag_default_values[0]}/>
            </GModal>
        }
        {show_form_classification[0] &&
            <GModal show={show_form_classification} title={`Agregar Centro de Costos`}>
                <GForm 
                    scheme={initial_props[0].classification_scheme} 
                    values={classification_values}
                    onSubmit={classification_form_action[0]=='insert'?save_new_classification:update_classification} 
                    action={classification_form_action[0]}
                    primary_action={classification_form_action[0]}
                    PRIMARY_ID={classification_id[0]}
                    values_base={classification_default_values[0]}
                    />
                
            </GModal>
        }
        </>
    );
}

 
export {AddMovimiento}