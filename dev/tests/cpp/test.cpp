
struct DataFrame {

    constexpr
    This&   operator [](const String& column) const {
        expect_2d(__FUNCTION__);
        ullong index = m_cols->find(column);
        if (index == NPos::npos) {
            throw KeyError(to_str("Column \"", column, "\" does not exist."));
        } else {
            return m_vals->get(index);
        }
    }
    
    // Dump to pipe.
    constexpr friend
    Pipe&   operator <<(Pipe& pipe, const This& obj) {
        obj.dump(pipe);
        return pipe;
    }
    
};

