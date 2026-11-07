// 소유: WJH
import { useRef } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

export default function VersionUploadPanel({ files, onChange, startVersionNo, disabled = false }) {

    const inputRef = useRef(null);

    function handleSelect(e) {
        const picked_files = Array.from(e.target.files);
        onChange([...files, ...picked_files]);
        e.target.value = null;
    }

    return (
        <div>
            <input
                ref = {inputRef}
                type = "file"
                multiple
                onChange = {handleSelect}
                accept = ".pdf, .docx"
                className = "hidden"           
            />

            <Button variant = "outline" onClick = { () => 
                inputRef.current.click() }>
                파일 선택
            </Button>

            <p>
                파일 {files.length}개, 시작 버전: v{startVersionNo}
            </p>
        </div>
    );
}

VersionUploadPanel.propTypes = {
    files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
    onChange: PropTypes.func.isRequired,
    startVersionNo: PropTypes.number.isRequired,
    disabled: PropTypes.bool
};
