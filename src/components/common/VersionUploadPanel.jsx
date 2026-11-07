// 소유: WJH
import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import Icon from './Icon';
import { formatFileSize } from '../../utils/format';

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;
const ALLOWED_FILE_TYPES = ['pdf', 'docx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

export default function VersionUploadPanel({ files, onChange, startVersionNo, disabled = false }) {

    const inputRef = useRef(null);
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const [errors, setErrors] = useState([]);
    const [fileOver, setFileOver] = useState(false);

    function addFiles(fileList) {
        const pickedFiles = Array.from(fileList);
        const acceptedFiles = [];
        const rejectedByReason = new Map();
        const existingFileKeys = new Set(files.map(fileKey));

        function reject(file, reason) {
            if (!rejectedByReason.has(reason)) {
                rejectedByReason.set(reason, []);
            }
            rejectedByReason.get(reason).push(file.name);
        }

        for (const file of pickedFiles) {
            const reason = getRejectReason(file);
            if (reason) {
                reject(file, reason);
            }
            else if (existingFileKeys.has(fileKey(file))) {
                reject(file, '이미 목록에 있는 파일입니다');
            }
            else if (files.length + acceptedFiles.length >= MAX_FILE_COUNT) {
                reject(file, `파일은 최대 ${MAX_FILE_COUNT}개까지 업로드할 수 있습니다`);
            }
            else {
                acceptedFiles.push(file);
                existingFileKeys.add(fileKey(file));
            }
        }

        onChange([...files, ...acceptedFiles]);
        setErrors(
            [...rejectedByReason].map(([reason, names]) => `${reason}: ${names.join(', ')}`)
        );
    }

    function handleSelect(e) {
        addFiles(e.target.files);
        e.target.value = null;
    }

    function handleDrop(e) {
        e.preventDefault();
        setFileOver(false);
        if (disabled) return;
        if (e.dataTransfer.files.length === 0) return;
        addFiles(e.dataTransfer.files);
    }

    function handleZoneDragOver(e) {
        e.preventDefault();

        if (disabled) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        if (e.dataTransfer.types.includes('Files')) {
            setFileOver(true);
        }
    }

    function handleZoneDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setFileOver(false);
        }
    }

    function reorder(fromIndex, toIndex) {
        if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
        const newFiles = [...files];
        const [movedFile] = newFiles.splice(fromIndex, 1);
        newFiles.splice(toIndex, 0, movedFile);
        onChange(newFiles);
    }

    function startDrag(index) {
        setDragIndex(index);
    }

    function endDrag() {
        setDragIndex(null);
        setOverIndex(null);
    }

    function remove(index) {
        const newFiles = [];
        for (let i = 0; i < files.length; i++) {
            if (i !== index) newFiles.push(files[i]);
        }
        onChange(newFiles);
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleSelect}
                accept=".pdf, .docx"
                className="hidden"
                disabled={disabled}
            />

            <div
                onDragOver={handleZoneDragOver}
                onDragLeave={handleZoneDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center gap-2 rounded-btn border-2 border-dashed px-4 py-6 text-center ${fileOver ? 'border-brand bg-soft' : 'border-line-strong'
                    } ${disabled ? 'opacity-50' : ''}`}
            >
                <p className="text-label text-muted">파일을 여기로 끌어다 놓거나</p>
                <Button variant="outline" disabled={disabled} onClick={() =>
                    inputRef.current.click()}>
                    파일 선택
                </Button>
                <p className="text-caption text-muted">PDF·DOCX, 파일당 20MB, 최대 10개</p>
            </div>

            {errors.length > 0 && (
                <ul role="alert" className="mt-2 flex flex-col gap-1 rounded-btn bg-danger-bg px-3 py-2 text-label text-danger">
                    {errors.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}

            {files.length > 0 && (
                <ol className="mt-3 flex flex-col gap-2">
                    {files.map((file, index) => (
                        <FileRow
                            key={fileKey(file)}
                            file={file}
                            order={index + 1}
                            versionNo={startVersionNo + index}
                            dragging={dragIndex === index}
                            over={overIndex === index && dragIndex !== index}
                            disabled={disabled}
                            onDragStart={() => startDrag(index)}
                            onDragOver={() => setOverIndex(index)}
                            onDrop={() => {
                                reorder(dragIndex, index);
                                endDrag();
                            }}
                            onDragEnd={endDrag}
                            onRemove={() => remove(index)}
                        />
                    ))}
                </ol>
            )}
        </div>
    );
}

function getRejectReason(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_FILE_TYPES.includes(extension)) {
        return 'PDF 또는 DOCX 파일만 업로드할 수 있습니다';
    }

    if (file.size === 0) {
        return '빈 파일은 업로드할 수 없습니다';
    }

    if (file.size > MAX_FILE_SIZE) {
        return '파일 크기는 20MB를 초과할 수 없습니다';
    }

    return null;
}

function FileRow({ file, order, versionNo, dragging, over, disabled, onDragStart, onDragOver, onDrop, onDragEnd, onRemove }) {
    return (
        <li
            draggable={!disabled}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', '');
                e.dataTransfer.effectAllowed = 'move';
                onDragStart();
            }}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver();
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop();
            }}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 rounded-btn border bg-white px-3 py-2 
                ${disabled ? 'cursor-default' : 'cursor-grab'}
                ${over ? 'border-brand' : 'border-line'} 
                ${dragging ? 'opacity-50' : ''}`}
        >
            <Icon name="grip" className="h-4 w-4 shrink-0 text-muted" />
            <span className="text-label text-muted">{order}.</span>
            <span className="min-w-0 flex-1 truncate text-body" title={file.name}>{file.name}</span>
            <span className="text-caption text-muted">{formatFileSize(file.size)}</span>
            <span className="text-label font-medium text-brand">v{versionNo}</span>
            <Button variant="ghost" size="sm" onClick={onRemove} disabled={disabled} aria-label={`${file.name} 빼기`} className="hover:text-danger">
                <Icon name="trash" />
            </Button>
        </li>
    );
}

VersionUploadPanel.propTypes = {
    files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
    onChange: PropTypes.func.isRequired,
    startVersionNo: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
};

FileRow.propTypes = {
    file: PropTypes.instanceOf(File).isRequired,
    order: PropTypes.number.isRequired,
    versionNo: PropTypes.number.isRequired,
    dragging: PropTypes.bool.isRequired,
    over: PropTypes.bool.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDragOver: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
};