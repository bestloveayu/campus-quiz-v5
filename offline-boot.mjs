/** Immutable embedded content takes precedence over unrelated editor saves. */
export function offlineStorageKey(base,embedded){
 return embedded?.project?.id?`${base}-offline-${embedded.project.id}`:base;
}

export function offlineProjectData(embedded){
 if(!embedded?.project||!Array.isArray(embedded.project.entities))throw Error('離線作品缺少正確的遊戲資料');
 return {project:structuredClone(embedded.project),edits:[],runs:[]};
}

export function offlineBankState(defaultState,embedded){
 if(!Array.isArray(embedded?.questions))throw Error('離線遊戲缺少題庫');
 return {...defaultState,version:1,questions:structuredClone(embedded.questions),logs:[],edits:[],completed:false};
}
