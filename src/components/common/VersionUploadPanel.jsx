// 소유: WJH
import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import Icon from './Icon';
import { formatFileSize } from '../../utils/format';

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

export default function VersionUploadPanel({ files, onChange, startVersionNo, disabled = false }) {

    const inputRef = useRef(null);
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);

    function handleSelect(e) {
        const pickedFiles = Array.from(e.target.files);
        onChange([...files, ...pickedFiles]);
        e.target.value = null;
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
            />

            <Button variant="outline" onClick={() =>
                inputRef.current.click()}>
                파일 선택
            </Button>

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

function FileRow({ file, order, versionNo, dragging, over, onDragStart, onDragOver, onDrop, onDragEnd, onRemove }) {
    return (
        <li
            draggable
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
            className={`flex cursor-grab items-center gap-2 rounded-btn border bg-white px-3 py-2 ${over ? 'border-brand' : 'border-line'
                } ${dragging ? 'opacity-50' : ''}`}
        >
            <Icon name="grip" className="h-4 w-4 shrink-0 text-muted" />
            <span className="text-label text-muted">{order}.</span>
            <span className="min-w-0 flex-1 truncate text-body" title={file.name}>{file.name}</span>
            <span className="text-caption text-muted">{formatFileSize(file.size)}</span>
            <span className="text-label font-medium text-brand">v{versionNo}</span>
            <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`${file.name} 빼기`} className="hover:text-danger">
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
};